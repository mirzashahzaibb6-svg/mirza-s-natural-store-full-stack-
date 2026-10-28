import { Suspense } from 'react';
import { PaymentView } from './payment-view';

export default function PaymentPage() {
  return <Suspense><PaymentView /></Suspense>;
}
