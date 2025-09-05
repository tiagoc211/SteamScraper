# proxy_steam_manager/proxy_manager_service.py
# Versão final com lógica de ROTAÇÃO PURA.

import sys
import os
import threading
from contextlib import asynccontextmanager
from datetime import datetime
from typing import List, Optional
from urllib.parse import urlparse

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import Proxy

# --- CONFIGURAÇÃO ---
DATA_FILE = r".\steam_live.txt"

# --- LÓGICA DO PROXY POOL (ROTATING) ---

def load_proxies_from_text_file(file_path: str) -> List[Proxy]:
    """Carrega proxies de um ficheiro de texto uma única vez no arranque."""
    proxies: List[Proxy] = []
    if not os.path.exists(file_path):
        print(f"ERRO CRÍTICO: Ficheiro de proxies não encontrado em '{file_path}'")
        return proxies
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f, 1):
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                try:
                    parsed_url = urlparse(line)
                    if not all([parsed_url.scheme, parsed_url.hostname, parsed_url.port]):
                        print(f"AVISO: Linha {i} ignorada (formato inválido): {line}")
                        continue
                    
                    protocol = parsed_url.scheme.lower()
                    if protocol == 'https':
                        protocol = 'http'
                    
                    proxies.append(Proxy(
                        ip=parsed_url.hostname,
                        port=parsed_url.port,
                        protocol=protocol,
                        username=parsed_url.username,
                        password=parsed_url.password
                    ))
                except Exception as e:
                    print(f"AVISO: Erro ao processar linha {i} '{line}': {e}")
    except Exception as e:
        print(f"ERRO FATAL ao ler o ficheiro de proxies '{file_path}': {e}")
    
    return proxies

class RotatingProxyPool:
    def __init__(self, data_file):
        # Carrega os proxies para uma lista
        self.proxy_list: List[Proxy] = load_proxies_from_text_file(data_file)
        self.current_index = 0
        self.lock = threading.Lock()  # Essencial para a segurança em ambiente concorrente

        if not self.proxy_list:
            print("AVISO CRÍTICO: NENHUM PROXY CARREGADO. O SERVIÇO NÃO FUNCIONARÁ.")
        else:
            print(f"({datetime.now().strftime('%H:%M:%S')}) Rotating Proxy Pool inicializado com {len(self.proxy_list)} proxies.")

    def get_next_proxy(self) -> Optional[Proxy]:
        """Obtém o próximo proxy da lista de forma circular e segura."""
        with self.lock:
            if not self.proxy_list:
                return None
            
            # Seleciona o proxy atual
            proxy = self.proxy_list[self.current_index]
            
            # Avança o índice para o próximo pedido, voltando ao início se necessário
            self.current_index = (self.current_index + 1) % len(self.proxy_list)
            
            return proxy

# Inicializa o pool uma vez
proxy_pool = RotatingProxyPool(DATA_FILE)

# --- INICIALIZAÇÃO DA APLICAÇÃO FASTAPI ---
app = FastAPI()

# --- MODELOS E ENDPOINTS DA API ---

class AcquireProxyResponse(BaseModel):
    ip: str
    port: int
    protocol: str
    proxy_key: str
    username: Optional[str] = None
    password: Optional[str] = None

class ReportProxyRequest(BaseModel):
    proxy_key: str
    success: bool

@app.get("/acquire_proxy", response_model=AcquireProxyResponse)
async def acquire_proxy(session_id: str): # session_id é recebido mas ignorado na lógica de rotação
    proxy = proxy_pool.get_next_proxy()
    if not proxy:
        raise HTTPException(status_code=503, detail="Proxy pool está vazio ou não foi carregado.")
    
    print(f"({datetime.now().strftime('%H:%M:%S')}) Proxy {proxy_pool.current_index}/{len(proxy_pool.proxy_list)} entregue.")
    
    return AcquireProxyResponse(
        ip=proxy.ip,
        port=proxy.port,
        protocol=proxy.protocol,
        proxy_key=proxy.get_key(),
        username=proxy.username,
        password=proxy.password
    )

@app.post("/report_proxy_usage")
async def report_proxy_usage(request: ReportProxyRequest):
    # Nesta versão, o reporte é recebido mas nenhuma ação é tomada.
    # Isto evita ter de alterar o código do backend Node.js.
    return {"status": "received, no action taken"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)