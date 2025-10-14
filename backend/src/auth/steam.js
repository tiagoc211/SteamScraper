const passport = require("passport");
const SteamStrategy = require("passport-steam").Strategy;
const pool = require("../db/index.js");
const { createLog } = require("../utils/logsHelper"); 

function setupSteamAuth(app) {
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));

  passport.use(new SteamStrategy({
    returnURL: `${process.env.DOMAIN}/auth/steam/return`,
    realm: process.env.DOMAIN,
    apiKey: process.env.STEAM_API_KEY
  }, async (identifier, profile, done) => {
    try {
      const steamId = profile.id;
      const displayName = profile.displayName;
      const avatar = profile.photos?.[2]?.value || null;

      // UPSERT e retornar o id da tabela users
      const result = await pool.query(`
        INSERT INTO users (steam_id, display_name, avatar_url)
        VALUES ($1, $2, $3)
        ON CONFLICT (steam_id)
        DO UPDATE SET display_name = $2, avatar_url = $3, updated_at = now()
        RETURNING id;
      `, [steamId, displayName, avatar]);

      const userId = result.rows[0].id; // este é o userId interno

       // Atribuir automaticamente role e subscription, se não tiver
      const userData = await pool.query(
        'SELECT subscription_id, role_id FROM users WHERE id = $1',
        [userId]
      );

      const hasSub = userData.rows[0]?.subscription_id;
      const hasRole = userData.rows[0]?.role_id;

      if (!hasSub) {
        const freeSub = await pool.query(`
          INSERT INTO subscriptions (type, start_date, end_date, status)
          VALUES ($1, NOW(), NOW() + INTERVAL '30 days', 'ATIVO')
          RETURNING id;
        `, [5]); // ID fixo do plano Free

        // Atualiza o user para apontar para a nova subscrição
        await pool.query(`
          UPDATE users
          SET subscription_id = $1
          WHERE id = $2
        `, [freeSub.rows[0].id, userId]);
      }


      const subResult = await pool.query(`
        SELECT s.id
        FROM subscriptions s
        JOIN users u ON u.subscription_id = s.id
        WHERE u.id = $1
      `, [userId]);

      if (subResult.rows.length > 0) {
        await pool.query(`
          UPDATE users
          SET subscription_id = $1
          WHERE id = $2
        `, [subResult.rows[0].id, userId]);
      }

      await pool.query(`
        UPDATE users
        SET role_id = COALESCE(role_id, (SELECT id FROM roles WHERE name = 'User' LIMIT 1))
        WHERE id = $1
      `, [userId]);

      await createLog({
        userId,
        action: 'LOGIN',
        details: {
          steam_id: steamId,
          display_name: displayName,
          avatar_url: avatar
        }
      });

      done(null, { ...profile, userId });
    } catch (err) {
      done(err);
    }
  }));

  app.get("/auth/steam", passport.authenticate("steam"));
  app.get("/auth/steam/return",
    passport.authenticate("steam", { failureRedirect: "/" }),
    (req, res) => {
      res.redirect(process.env.CORS_ORIGIN);
    }
  );

  app.get("/api/me", async (req, res) => {
    if (req.isAuthenticated()) {
      const u = req.user;

        // Buscar role do userId
      const result = await pool.query(`
        SELECT r.name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = $1
      `, [u.userId]);

      const role = result.rows[0]?.name || null;

      res.json({ 
        user: {
          id: u.userId, // já tens o userId disponível
          displayName: u.displayName,
          photos: u.photos,
          role
        }
      });
    } else {
      res.json({ user: null });
    }
  });

  app.get("/auth/logout", (req, res) => {
    const user = req.user;
    req.logout(async err => {
      if (err) return res.status(500).json({ error: "Erro ao terminar sessão" });

      if (user?.userId) {
        await createLog({
          userId: user.userId,
          action: 'LOGOUT',
          details: { display_name: user.displayName }
        });
      }

      res.redirect(process.env.CORS_ORIGIN);
    });
  });
}

module.exports = setupSteamAuth;
