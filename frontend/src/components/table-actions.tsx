import { Ban, Pencil, Power, PowerOff, Plus } from 'lucide-react';
import { Button } from './button';

export function CreateButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <Button type="button" onClick={onClick}><Plus className="h-4 w-4" />{label}</Button>;
}

export function IconEditButton({ onClick }: { onClick: () => void }) {
  return <Button type="button" aria-label="Editar" size="icon" variant="secondary" onClick={onClick} title="Editar"><Pencil className="h-4 w-4" /></Button>;
}

export function IconToggleButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return <Button type="button" aria-label={active ? 'Desactivar' : 'Activar'} size="icon" variant={active ? 'danger' : 'default'} onClick={onClick} title={active ? 'Desactivar' : 'Activar'}>{active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}</Button>;
}

export function IconCancelButton({ onClick }: { onClick: () => void }) {
  return <Button type="button" aria-label="Cancelar" size="icon" variant="danger" onClick={onClick} title="Cancelar"><Ban className="h-4 w-4" /></Button>;
}
