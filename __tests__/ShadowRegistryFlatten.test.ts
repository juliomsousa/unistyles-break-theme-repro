const mockLink = jest.fn()

jest.mock('react-native-nitro-modules', () => ({
  NitroModules: {createHybridObject: () => ({link: mockLink})}
}))

// the babel-facing `add` is stripped from the public type
const {UnistylesShadowRegistry} = require('../node_modules/react-native-unistyles/lib/commonjs/specs/ShadowRegistry') as {
  UnistylesShadowRegistry: {add: (handle: unknown, styles: unknown) => void}
}

// same nesting as Link.Bold
const sharedDyn = {fontWeight: '400'}
const linkDyn = {textDecorationLine: 'underline'}
const regular = {fontSize: 18}
const bold = {fontWeight: '700'}

const handle = {__internalInstanceHandle: {stateNode: {node: {}}}}

const linkedStyles = (styles: unknown): unknown[] => {
  mockLink.mockClear()
  UnistylesShadowRegistry.add(handle, styles)
  return mockLink.mock.calls[0][1]
}

describe('ShadowRegistry.add style flattening', () => {
  it('flattens 3 nesting levels (BodyBold) completely', () => {
    const linked = linkedStyles([sharedDyn, [regular, [bold, undefined]]])

    expect(linked).toEqual([sharedDyn, regular, bold])
  })

  it('flattens 4 nesting levels (Link.Bold) completely', () => {
    const linked = linkedStyles([
      sharedDyn,
      [linkDyn, [regular, [bold, undefined]]]
    ])

    // fails on 3.4.0: the last entry is still the unflattened array [bold, undefined]
    expect(linked.some(Array.isArray)).toBe(false)
    expect(linked).toContainEqual(bold)
  })
})
