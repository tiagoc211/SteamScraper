const passport = require("passport");
const SteamStrategy = require("passport-steam").Strategy;
const pool = require("./db");

function setupSteamAuth(app) {
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));

  passport.use(new SteamStrategy({
    returnURL: "http://localhost:3001/auth/steam/return",
    realm: "http://localhost:3001/",
    apiKey: process.env.STEAM_API_KEY
  }, async (identifier, profile, done) => {
    try {
      const steamId = profile.id;
      const displayName = profile.displayName;
      const avatar = profile.photos?.[2]?.value || null;

      await pool.query(`
        INSERT INTO users (steam_id, display_name, avatar_url)
        VALUES ($1, $2, $3)
        ON CONFLICT (steam_id)
        DO UPDATE SET display_name = $2, avatar_url = $3, updated_at = now();
      `, [steamId, displayName, avatar]);

      done(null, profile);
    } catch (err) {
      done(err);
    }
  }));

  app.get("/auth/steam", passport.authenticate("steam"));
  app.get("/auth/steam/return",
    passport.authenticate("steam", { failureRedirect: "/" }),
    (req, res) => {
      // Redireciona de volta para o frontend
      res.redirect("http://localhost:3000/");
    }
  );


  app.get("/api/me", (req, res) => {
  if (req.isAuthenticated()) {
    const u = req.user;
    res.json({ 
      user: {
        displayName: u.displayName,
        photos: u.photos // mantém array de fotos
      }
    });
  } else {
    res.json({ user: null });
  }
});


  app.get("/auth/logout", (req, res) => {
    req.logout(err => {
      if (err) return res.status(500).json({ error: "Erro ao terminar sessão" });
      res.redirect("http://localhost:3000/"); // volta para o frontend
    });
  });


}

module.exports = setupSteamAuth;
