import React from 'react';

// Estilos para este componente serão adicionados em SkinDetailPage.css
// para manter tudo junto por enquanto.

const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null; // Não mostra os controlos se houver apenas uma página
  }

  return (
    <div className="pagination-controls">
      <button 
        className="pagination-button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Anterior
      </button>
      <span className="pagination-info">
        Página {currentPage} de {totalPages}
      </span>
      <button 
        className="pagination-button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Próximo
      </button>
    </div>
  );
};

export default PaginationControls;