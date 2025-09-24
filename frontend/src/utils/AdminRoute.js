import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

function AdminRoute({ children, redirectPath = "/login" }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("http://localhost:3001/api/me", {
          credentials: "include",
        });
        const data = await res.json();

        if (data.user && data.user.role === "Admin") {
          console.log("debug: admin true");
          setIsAdmin(true);
        } else {
          console.log("debug: admin false");
          setIsAdmin(false);
        }
      } catch (err) {
        console.error("Erro ao verificar role:", err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  if (loading) {
    return <div>A verificar permissões...</div>;
  }

  return isAdmin ? children : <Navigate to={redirectPath} replace />;
}

export default AdminRoute;
