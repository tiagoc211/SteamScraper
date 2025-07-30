import React, { useState } from 'react';
import { FaSearch, FaArrowLeft } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './HomePage.css';

// Componentes e Dados
import { rifles, smgs, heavy, pistols, knives } from '../data/Weapons';
import * as rifleSkins from '../data/Rifles';
import * as smgSkins from '../data/Smgs';
import * as heavySkins from '../data/Heavy';
import * as pistolSkins from '../data/Pistols';
import * as knifeSkins from '../data/Knives';
import { searchSkins } from '../api/Skins';
import SkinCard from '../components/SkinCard';
import RadialMenu from '../components/RadialMenu';

const allSkinsData = { ...rifleSkins, ...smgSkins, ...heavySkins, ...pistolSkins, ...knifeSkins };

const weaponToDataKeyMap = {
    // Rifles
    "AK-47": "ak47Skins",
    "AUG": "augSkins",
    "AWP": "awpSkins",
    "FAMAS": "famasSkins",
    "G3SG1": "g3sg1Skins",
    "Galil AR": "galilARSkins",
    "M4A1-S": "m4a1sSkins",
    "M4A4": "m4a4Skins",
    "SCAR-20": "scar20Skins",
    "SG 553": "sg553Skins",
    "SSG 08": "ssg08Skins",

    // SMGs
    "MAC-10": "mac10Skins",
    "MP5-SD": "mp5sdSkins",
    "MP7": "mp7Skins",
    "MP9": "mp9Skins",
    "PP-Bizon": "ppBizonSkins",
    "P90": "p90Skins",
    "UMP-45": "ump45Skins",

    // Heavy
    "MAG-7": "mag7Skins",
    "Nova": "novaSkins",
    "Sawed-Off": "sawedOffSkins",
    "XM1014": "xm1014Skins",
    "M249": "m249Skins",
    "Negev": "negevSkins",

    // Pistols
    "USP-S": "uspSkins",
    "Glock-18": "glock18Skins",
    "Desert Eagle": "desertEagleSkins",
    "P250": "p250Skins",
    "Five-SeveN": "fiveSevenSkins",
    "CZ75-Auto": "cz75Skins",
    "P2000": "p2000Skins",
    "Tec-9": "tec9Skins",
    "R8 Revolver": "r8Skins",
    "Dual Berettas": "dualBerettasSkins",

    // Knives
    "Bayonet": "bayonetSkins",
    "Bowie Knife": "bowieKnifeSkins",
    "Butterfly Knife": "butterflyKnifeSkins",
    "Classic Knife": "classicKnifeSkins",
    "Falchion Knife": "falchionKnifeSkins",
    "Flip Knife": "flipKnifeSkins",
    "Gut Knife": "gutKnifeSkins",
    "Huntsman Knife": "huntsmanKnifeSkins",
    "Karambit": "karambitSkins",
    "Kukri Knife": "kukriKnifeSkins",
    "M9 Bayonet": "m9BayonetSkins",
    "Navaja Knife": "navajaKnifeSkins",
    "Nomad Knife": "nomadKnifeSkins",
    "Paracord Knife": "paracordKnifeSkins",
    "Shadow Daggers": "shadowDaggersSkins",
    "Skeleton Knife": "skeletonKnifeSkins",
    "Stiletto Knife": "stilettoKnifeSkins",
    "Survival Knife": "survivalKnifeSkins",
    "Talon Knife": "talonKnifeSkins",
    "Ursus Knife": "ursusKnifeSkins",
};
const getSkinsForWeapon = (weaponName) => {
  const dataKey = weaponToDataKeyMap[weaponName];
  if (!dataKey || !allSkinsData[dataKey]) return [];
  const weaponData = allSkinsData[dataKey];
  const skinNames = Object.values(weaponData).flat().map(skin => skin.name.split(' | ')[1]);
  return [...new Set(skinNames)].sort();
};

const categoryItems = [
  { key: 'pistols', label: 'Pistol' },
  { key: 'heavy', label: 'Heavy' },
  { key: 'smgs', label: 'SMG' },
  { key: 'rifles', label: 'Rifle' },
  { key: 'knives', label: 'Knives' },
];

const weaponTypes = { rifles, smgs, heavy, pistols, knives };

const HomePage = () => {
  const [selectionStep, setSelectionStep] = useState('category');
  const [selectedType, setSelectedType] = useState(null);
  const [selectedWeapon, setSelectedWeapon] = useState('');
  const [skinQuery, setSkinQuery] = useState('');
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleBack = () => {
    if (selectionStep === 'skin') {
      setSelectedWeapon('');
      setSkinQuery('');
      setSelectionStep('weapon');
    } else if (selectionStep === 'weapon') {
      setSelectedType(null);
      setSelectionStep('category');
    }
  };

  const handleCategorySelect = (categoryKey) => {
    if (!weaponTypes[categoryKey]) return;
    setSelectedType(categoryKey);
    setSelectionStep('weapon');
  };

  const handleWeaponSelect = (weaponName) => {
    setSelectedWeapon(weaponName);
    setSelectionStep('skin');
  };

  const handleSearch = async () => {
    if (!selectedWeapon || !skinQuery) {
      alert("Por favor, selecione uma arma e uma skin.");
      return;
    }
    setLoading(true);
    setHasSearched(true);
    setResults([]);
    // A pesquisa usa sempre o `selectedWeapon` que tem o nome completo (ex: "Bowie Knife")
    const searchResults = await searchSkins(selectedWeapon, skinQuery);
    setResults(searchResults);
    setLoading(false);
  };
  
  // Constrói os itens para o menu, mas ajusta o `label` para as facas
  const weaponItems = selectedType 
    ? weaponTypes[selectedType].map(w => ({
        key: w, // O `key` mantém o nome completo (ex: "Bowie Knife")
        label: w.replace(' Knife', ''), // O `label` remove " Knife" para exibição
      }))
    : [];

  return (
    <div className="homepage">
      <section className="interactive-selection-area">
        <div className="preview-area">
          {selectionStep === 'category' && (
            <RadialMenu
              title="Categoria"
              items={categoryItems}
              onSelect={handleCategorySelect}
              onHover={() => {}}
            />
          )}

          {selectionStep === 'weapon' && (
            <RadialMenu
              title={selectedType}
              items={weaponItems}
              onSelect={handleWeaponSelect}
              onHover={() => {}}
            />
          )}

          {selectionStep === 'skin' && (
            <div className="skin-selection-container">
              <div className="skin-selection-header">
                  <h2>{selectedWeapon}</h2>
                  <p>Selecione a skin desejada</p>
              </div>
              <div className="skin-selection-controls">
                <select 
                    className="custom-select" 
                    value={skinQuery}
                    onChange={e => setSkinQuery(e.target.value)}
                >
                    <option value="">Selecione uma skin...</option>
                    {getSkinsForWeapon(selectedWeapon).map(skinName => (
                        <option key={skinName} value={skinName}>{skinName}</option>
                    ))}
                </select>
              </div>
            </div>
          )}
        </div>
        
        <div className="controls-area">
          {selectionStep !== 'category' && (
            <button onClick={handleBack} className="control-button back-button">
              <FaArrowLeft /> Voltar
            </button>
          )}
          {selectionStep === 'skin' && (
            <button className="control-button search-button" onClick={handleSearch} disabled={loading || !skinQuery}>
              {loading ? '...' : <FaSearch />}
              <span>Pesquisar</span>
            </button>
          )}
        </div>
      </section>

      {/* Secção de Resultados (sem alterações) */}
      <section className="results-section">
        {loading && <div className="loader">A Carregar...</div>}
        {!loading && results.length > 0 && (
          <div className="results-grid">
            {results.map((skin) => (
              <Link 
                key={skin.market_hash_name} 
                to={`/skin/${encodeURIComponent(skin.market_hash_name)}`}
                className="skin-card-link"
              >
                <SkinCard skin={skin} />
              </Link>
            ))}
          </div>
        )}
        {!loading && results.length === 0 && hasSearched && (
          <div className="no-results">
            <p>Nenhuma skin encontrada.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;