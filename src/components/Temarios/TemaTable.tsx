import { TemaTemario } from '@/types';
import { RecursoLink } from './RecursoLink';
import './Temarios.css';

interface TemaTableProps {
  temas: TemaTemario[];
}

export const TemaTable = ({ temas }: TemaTableProps) => {
  return (
    <div className="temas-table-container">
      <table className="temas-table">
        <thead>
          <tr>
            <th style={{ width: 48, textAlign: 'center' }}>#</th>
            <th>Tema de la Oposición</th>
            <th>Recursos de la Academia</th>
          </tr>
        </thead>
        <tbody>
          {temas.map((tema, index) => (
            <tr key={index}>
              <td data-label="#" style={{ textAlign: 'center', color: '#5BE4EB', fontWeight: 600, fontSize: 14 }}>
                {index + 1}
              </td>
              <td data-label="Tema de la Oposición">
                <span className="tema-titulo">{tema.titulo_tema_oposicion}</span>
              </td>
              <td data-label="Recursos de la Academia">
                <div className="recursos-list">
                  {tema.recursos.map((recurso, rIndex) => (
                    <RecursoLink key={rIndex} recurso={recurso} />
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
