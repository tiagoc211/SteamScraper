# Ficheiro: models.py
# Versão simplificada para rotação pura.

from pydantic import BaseModel
from typing import Optional

class Proxy(BaseModel):
    ip: str
    port: int
    protocol: str
    username: Optional[str] = None
    password: Optional[str] = None
    
    def get_key(self) -> str:
        """
        Retorna o URL completo do proxy, que serve como chave única.
        """
        auth_part = f"{self.username}:{self.password}@" if self.username and self.password else ""
        return f"{self.protocol}://{auth_part}{self.ip}:{self.port}"