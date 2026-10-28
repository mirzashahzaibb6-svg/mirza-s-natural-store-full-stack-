export interface Address {
  id: string;
  addressLine: string;
  city: string;
  county: string;
  postcode: string;
  isDefault: boolean;
}
export interface AddressInput {
  addressLine: string;
  city: string;
  county: string;
  postcode: string;
  isDefault?: boolean;
}
