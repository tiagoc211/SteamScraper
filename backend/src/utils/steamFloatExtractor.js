/**
 * Extrai float value e paint seed diretamente do Steam
 * Sem dependência de serviço Float Inspector externo
 */

const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

/**
 * Extrai float e pattern diretamente de um Steam inspect link
 * @param {string} inspectLink - URL ou steam:// link do inspect
 * @returns {Promise<{floatvalue: number, paintseed: number, pattern: number} | {}>}
 */
async function extractFloatFromSteam(inspectLink) {
    try {
        if (!inspectLink) return {};

        // Trata links steam://
        if (inspectLink.startsWith('steam://')) {
            return await extractFromSteamProtocol(inspectLink);
        }

        // Trata links HTTP
        if (inspectLink.startsWith('http')) {
            return await extractFromWebLink(inspectLink);
        }

        return {};
    } catch (error) {
        console.error(`⚠️ Erro ao extrair float do Steam: ${error.message}`);
        return {};
    }
}

/**
 * Extrai de um link steam://
 */
async function extractFromSteamProtocol(inspectLink) {
    try {
        // Extrai IDs do link: steam://rungame/730/...+...%20D_S...M...A...D...
        const match = inspectLink.match(/D_S(\d+)M(\d+)A(\d+)D(\d+)/);
        if (!match) {
            console.warn('⚠️ Não foi possível extrair IDs do link steam://');
            return {};
        }

        const [, s, m, a, d] = match;
        
        // Constrói URL web para buscar dados
        const webLink = `https://steamcommunity.com/inventory/bot/${s}/${m}/p${a}d${d}`;
        
        return await fetchFloatFromUrl(webLink);
    } catch (error) {
        console.error(`⚠️ Erro ao processar steam:// link: ${error.message}`);
        return {};
    }
}

/**
 * Extrai de um link HTTP
 */
async function extractFromWebLink(inspectLink) {
    try {
        // Tenta buscar direto da URL
        const floatData = await fetchFloatFromUrl(inspectLink);
        
        if (floatData.floatvalue !== undefined) {
            return floatData;
        }

        // Se não conseguir direto, tenta fazer parsing do HTML
        return await parseHtmlForFloat(inspectLink);
    } catch (error) {
        console.error(`⚠️ Erro ao processar link HTTP: ${error.message}`);
        return {};
    }
}

/**
 * Faz requisição direto ao Steam para obter dados do item
 */
async function fetchFloatFromUrl(url) {
    try {
        const response = await fetch(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) return {};

        const html = await response.text();
        
        // Procura por padrões JSON com float value no HTML
        const floatMatch = html.match(/"float_value":\s*([\d.]+)/);
        const seedMatch = html.match(/"item_paintkit":\s*(\d+)/);
        const patternMatch = html.match(/"item_quality":\s*(\d+)|"paint_seed":\s*(\d+)/);

        if (floatMatch) {
            return {
                floatvalue: parseFloat(floatMatch[1]),
                paintseed: seedMatch ? parseInt(seedMatch[1]) : 0,
                pattern: patternMatch ? parseInt(patternMatch[1] || patternMatch[2] || 0) : 0
            };
        }

        // Tenta outro padrão
        const objMatch = html.match(/\"iteminfo\":\s*(\{[^}]+(?:\{[^}]*\}[^}]*)*\})/);
        if (objMatch) {
            const itemInfo = JSON.parse(objMatch[1]);
            return {
                floatvalue: itemInfo.floatvalue || itemInfo.float_value,
                paintseed: itemInfo.paintseed || itemInfo.paint_seed || itemInfo.seed,
                pattern: itemInfo.pattern || itemInfo.paint_seed || 0
            };
        }

        return {};
    } catch (error) {
        console.error(`⚠️ Erro ao buscar float da URL: ${error.message}`);
        return {};
    }
}

/**
 * Faz parsing do HTML para extrair dados do item
 */
async function parseHtmlForFloat(inspectLink) {
    try {
        const response = await fetch(inspectLink, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) return {};

        const html = await response.text();
        
        // Procura por scripts com dados do item
        const scriptMatch = html.match(/var g_item = ({[\s\S]*?});/);
        if (scriptMatch) {
            try {
                const itemData = JSON.parse(scriptMatch[1]);
                return {
                    floatvalue: itemData.floatvalue || itemData.float_value,
                    paintseed: itemData.paintseed || itemData.paint_seed,
                    pattern: itemData.paintseed || itemData.paint_seed || 0
                };
            } catch (e) {
                console.warn('⚠️ Erro ao parsear JSON do item');
            }
        }

        // Procura por padrões comuns no HTML
        const patterns = {
            floatvalue: /"floatvalue":\s*([\d.]+)/,
            paintseed: /"paintseed":\s*(\d+)/,
            pattern: /"pattern":\s*(\d+)/
        };

        const result = {};
        for (const [key, regex] of Object.entries(patterns)) {
            const match = html.match(regex);
            if (match) {
                result[key] = key === 'floatvalue' ? parseFloat(match[1]) : parseInt(match[1]);
            }
        }

        return result;
    } catch (error) {
        console.error(`⚠️ Erro ao fazer parsing do HTML: ${error.message}`);
        return {};
    }
}

module.exports = { extractFloatFromSteam };
