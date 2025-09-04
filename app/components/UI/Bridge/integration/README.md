# Bridge Integration Tests

This directory contains comprehensive integration tests for the Bridge quote fetching system.

## Test Coverage

### Cross-Chain Transaction Flows
- EVM to EVM bridging (Ethereum to Polygon)
- EVM to Solana bridging with destination address handling
- Solana to EVM bridging
- Multi-step bridge transactions with intermediate chains

### Quote Validation
- Amount conversion with different token decimals
- Insufficient balance detection
- Token address validation
- Slippage validation
- Price impact calculations

### Timeout and Expiration Handling
- Quote expiration without refresh
- Quote expiration with automatic refresh
- Refresh rate configuration
- Maximum refresh count limits
- Debounced quote requests

### Error Scenarios
- External API failures
- Network connectivity issues
- Invalid quote responses
- Provider unavailability
- Loading states
- Rate limiting scenarios

### End-to-End Integration
- Complete workflow testing (quote request → data processing → UI state)
- Cross-chain workflow with state updates
- Error recovery workflows
- Complex multi-chain scenarios

## Running Tests

```bash
# Run all bridge integration tests
yarn jest app/components/UI/Bridge/integration/

# Run specific integration test file
yarn jest app/components/UI/Bridge/integration/BridgeQuoteFetching.integration.test.ts

# Run with coverage
yarn jest app/components/UI/Bridge/integration/ --coverage
```

## Test Architecture

The integration tests follow the established patterns in the codebase:

- Use `createBridgeTestState` utility for consistent state setup
- Mock `Engine.context.BridgeController` for external API interactions
- Follow existing hook testing patterns with `renderHookWithProvider`
- Use realistic mock data based on actual bridge API responses
- Test both success and failure scenarios comprehensively

## Mock Data

The tests use and extend existing mock data:
- `mock-quotes-sol-sol.json` for Solana bridge scenarios
- Custom mock responses for various error conditions
- Cross-chain specific mock data for different network combinations
