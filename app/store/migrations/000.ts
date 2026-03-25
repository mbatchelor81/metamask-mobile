/**
 * Needed after https://github.com/MetaMask/controllers/pull/152
 *
 **/
export default function migrate(state: Record<string, unknown>): Record<string, unknown> {
  const addressBook =
    (state as any).engine.backgroundState.AddressBookController.addressBook;
  const migratedAddressBook: Record<string, Record<string, unknown>> = {};
  Object.keys(addressBook).forEach((address: string) => {
    const chainId: string = addressBook[address].chainId.toString();
    migratedAddressBook[chainId]
      ? (migratedAddressBook[chainId] = {
          ...migratedAddressBook[chainId],
          [address]: addressBook[address],
        })
      : (migratedAddressBook[chainId] = { [address]: addressBook[address] });
  });
  (state as any).engine.backgroundState.AddressBookController.addressBook =
    migratedAddressBook;
  return state;
}
