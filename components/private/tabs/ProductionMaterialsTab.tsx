import { FormEvent, useState } from 'react';
import { ProductionMaterial, ProductionMaterialCategory } from '@/components/private/private-types';

const categories: Array<{ value: ProductionMaterialCategory; label: string }> = [
  { value: 'camera', label: 'Cámaras' },
  { value: 'drone', label: 'Drones' },
  { value: 'lighting', label: 'Iluminación' },
  { value: 'sound', label: 'Sonido' },
  { value: 'format', label: 'Formatos' },
];

type ProductionMaterialsTabProps = {
  materials: ProductionMaterial[];
  busyId: string;
  isCreating: boolean;
  onCreate: (category: ProductionMaterialCategory, name: string, basePrice: string) => Promise<boolean>;
  onUpdate: (id: string, name: string, basePrice: string) => Promise<boolean>;
  onSetActive: (id: string, active: boolean) => void;
};

export function ProductionMaterialsTab({
  materials,
  busyId,
  isCreating,
  onCreate,
  onUpdate,
  onSetActive,
}: ProductionMaterialsTabProps) {
  const [category, setCategory] = useState<ProductionMaterialCategory>('camera');
  const [name, setName] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [drafts, setDrafts] = useState<Record<string, { name: string; basePrice: string }>>({});

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (await onCreate(category, name, basePrice)) {
      setName('');
      setBasePrice('');
    }
  };

  const updateDraft = (material: ProductionMaterial, field: 'name' | 'basePrice', value: string) => {
    setDrafts((current) => ({
      ...current,
      [material.id]: {
        name: current[material.id]?.name ?? material.name,
        basePrice: current[material.id]?.basePrice ?? String(material.basePrice ?? ''),
        [field]: value,
      },
    }));
  };

  const groupedMaterials = categories.map((item) => ({
    ...item,
    materials: materials.filter((material) => material.category === item.value),
  }));

  return (
    <div className="private-tab-panel production-materials-tab" role="tabpanel">
      <section className="private-request-section">
        <h3>Catálogo de materiales de producción</h3>
        <p className="production-materials-intro">Los precios base se copiarán al desglose del contrato al seleccionar el material y podrán ajustarse para cada evento.</p>

        <form className="production-material-add-form" onSubmit={(event) => void handleCreate(event)}>
          <label>
            Categoría
            <select value={category} onChange={(event) => setCategory(event.target.value as ProductionMaterialCategory)}>
              {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label>
            Material
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required placeholder="Nombre del material" />
          </label>
          <label>
            Precio base (€)
            <input type="number" min="0" step="0.01" value={basePrice} onChange={(event) => setBasePrice(event.target.value)} placeholder="Opcional" />
          </label>
          <button type="submit" className="private-material-save" disabled={isCreating}>
            {isCreating ? 'Añadiendo...' : 'Añadir material'}
          </button>
        </form>

        {groupedMaterials.map((group) => (
          <section className="production-material-group" key={group.value}>
            <h4>{group.label}</h4>
            {group.materials.length === 0 ? (
              <p className="private-empty-state">No hay materiales en esta categoría.</p>
            ) : (
              <div className="production-material-list">
                {group.materials.map((material) => {
                  const draft = drafts[material.id];
                  return (
                    <form
                      className={`production-material-row${material.active ? '' : ' inactive'}`}
                      key={material.id}
                      onSubmit={(event) => {
                        event.preventDefault();
                        void onUpdate(material.id, draft?.name ?? material.name, draft?.basePrice ?? String(material.basePrice ?? ''));
                      }}
                    >
                      <span className="production-material-state">{material.active ? 'Activo' : 'Retirado'}</span>
                      <label>
                        Nombre
                        <input value={draft?.name ?? material.name} onChange={(event) => updateDraft(material, 'name', event.target.value)} maxLength={120} required />
                      </label>
                      <label>
                        Precio base (€)
                        <input type="number" min="0" step="0.01" value={draft?.basePrice ?? String(material.basePrice ?? '')} onChange={(event) => updateDraft(material, 'basePrice', event.target.value)} placeholder="Sin precio" />
                      </label>
                      <button type="submit" className="private-material-save" disabled={busyId === material.id}>
                        {busyId === material.id ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button type="button" className="private-material-toggle" disabled={busyId === material.id} onClick={() => onSetActive(material.id, !material.active)}>
                        {material.active ? 'Retirar' : 'Reactivar'}
                      </button>
                    </form>
                  );
                })}
              </div>
            )}
          </section>
        ))}
      </section>
    </div>
  );
}
