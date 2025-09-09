// frontend/src/components/home/FeaturesSection/FeaturesSection.js
import React from 'react';
import ScrollFloat from '../../ui/ScrollFloat/ScrollFloat';
import './FeaturesSection.css';

// CAMINHOS CORRIGIDOS: De ../data/ para ../../../data/
import graficoImg from '../../../data/images/grafico.png';
import funilImg from '../../../data/images/Funil.png';
import banImg from '../../../data/images/Ban.png';

const featuresData = [
  {
    title: "Descubra o Invisível",
    description: "Acesse dados cruciais como o Float Value e o Pattern ID, que a Steam não mostra. Encontre a skin perfeita, do 'Blue Gem' ao 'Full Fade', com a informação que realmente importa.",
    imageUrl: graficoImg
  },
  {
    title: "Filtros de Nível Profissional",
    description: "Esqueça a busca genérica. Filtre skins por float exato, patterns específicos e até stickers aplicados. A sua busca, as suas regras, sem compromissos.",
    imageUrl: funilImg
  },
  {
    title: "Navegue Sem Medo",
    description: "Faça quantas pesquisas quiser, sem se preocupar com os limites de requests da Steam. A nossa tecnologia protege-o de restrições e bans, garantindo acesso contínuo e ilimitado.",
    imageUrl: banImg
  }
];

const FeaturesSection = () => {
  return (
    <section className="features-section">
      <div className="features-intro">
        <ScrollFloat containerClassName="title">Porquê Nós?</ScrollFloat>
      </div>
      {featuresData.map((feature, index) => (
        <div className="feature-item" key={index}>
          <div className="feature-image-container">
            <img src={feature.imageUrl} alt={feature.title} className="feature-image" />
          </div>
          <div className="feature-text-content">
            <ScrollFloat containerClassName="title">{feature.title}</ScrollFloat>
            <ScrollFloat 
              containerClassName="description"
              stagger={0.01}
              ease="power2.inOut"
            >
              {feature.description}
            </ScrollFloat>
          </div>
        </div>
      ))}
    </section>
  );
};

export default FeaturesSection;