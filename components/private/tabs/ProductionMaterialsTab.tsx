import { FormEvent, useState } from 'react';
import { ProductionMaterial, ProductionMaterialCategory } from '@/lib/private-types';
import { createFormFields } from '@/components/common/FormFields';

const categories: Array<{ value: ProductionMaterialCategory; label: string }> = [
  { value: 'camera', label: 'Cámaras' },
  { value: 'drone', label: 'Drones' },
  { value: 'lighting', label: 'Iluminación' },
  { value: 'sound', label: 'Sonido' },
  { value: 'format', label: 'Formatos' },
];

type ProductionMaterialsTabProps = {
  materials: ProductionMaterial[];
  isLoading: boolean;
  error: string;
  busyId: string;
  isCreating: boolean;
  onRetry: () => void;
  onCreate: (category: ProductionMaterialCategory, name: string, basePrice: string) => Promise<boolean>;
  onUpdate: (id: string, name: string, basePrice: string) => Promise<boolean>;
  onSetActive: (id: string, active: boolean) => void;
};

export function ProductionMaterialsTab({
  materials,
  isLoading,
  error,
  busyId,
  isCreating,
  onRetry,
  onCreate,
  onUpdate,
  onSetActive,
}: ProductionMaterialsTabProps) {
  const [category, setCategory] = useState<ProductionMaterialCategory>('camera');
  const [name, setName] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [drafts, setDrafts] = useState<Record<string, { name: string; basePrice: string }>>({});

  const createFields = createFormFields({
    values: { name, basePrice },
    idPrefix: 'production-material-new',
    onChange: (field, value) => {
      if (field === 'name') setName(value);
      else setBasePrice(value);
    },
  });

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

        {isLoading ? (
          <p className="private-empty-state" role="status">Cargando catálogo de materiales...</p>
        ) : error ? (
          <div className="private-empty-state" role="alert">
            <p>{error}</p>
            <button type="button" className="private-gold-button" onClick={onRetry}>Reintentar</button>
          </div>
        ) : (
          <>
            <form className="production-material-add-form" onSubmit={(event) => void handleCreate(event)}>
              <label>
                Categoría
                <select value={category} onChange={(event) => setCategory(event.target.value as ProductionMaterialCategory)}>
                  {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              {createFields.input('name', 'Material', 'text', true, false, false, 'Nombre del material', 120)}
              {createFields.inputSuffix('basePrice', 'Precio base', false, false, false, '€', 'Opcional')}
              <button type="submit" className="private-gold-button" disabled={isCreating}>
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
                      const materialFields = createFormFields({
                        values: {
                          name: draft?.name ?? material.name,
                          basePrice: draft?.basePrice ?? String(material.basePrice ?? ''),
                        },
                        idPrefix: `production-material-${material.id}`,
                        onChange: (field, value) => updateDraft(material, field, value),
                      });

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
                          {materialFields.input('name', 'Nombre', 'text', true, false, false, undefined, 120)}
                          {materialFields.inputSuffix('basePrice', 'Precio base', false, false, false, '€', 'Sin precio')}
                          <button type="submit" className="private-gold-button" disabled={busyId === material.id}>
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
          </>
        )}
      </section>
    </div>
  );
}
