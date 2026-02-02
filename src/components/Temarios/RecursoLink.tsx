import { Recurso } from '@/types';
import { FileText, ExternalLink } from 'lucide-react';
import './Temarios.css';

interface RecursoLinkProps {
  recurso: Recurso;
}

export const RecursoLink = ({ recurso }: RecursoLinkProps) => {
  return (
    <>
      <FileText className="recurso-icon" />
      <span className="recurso-filename">{recurso.filename}</span>
      <ExternalLink className="recurso-external-icon" />
    </>
  );
};