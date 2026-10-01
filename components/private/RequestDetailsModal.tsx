import { WeddingRequestDetailsModal } from './WeddingRequestDetailsModal';
import { ProductionRequestDetailsModal } from './ProductionRequestDetailsModal';
import { RequestDetailsModalProps } from './private-types';

export function RequestDetailsModal(props: RequestDetailsModalProps) {
  return props.request.type === 'wedding'
    ? <WeddingRequestDetailsModal {...props} />
    : <ProductionRequestDetailsModal {...props} />;
}