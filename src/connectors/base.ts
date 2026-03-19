import { ConnectorType, ConnectorResult, ConnectorStatus, ConnectorConfig } from '@/lib/types';

export interface IConnector {
  type: ConnectorType;
  fetchData(config: ConnectorConfig): Promise<ConnectorResult>;
  testConnection(config: ConnectorConfig): Promise<boolean>;
  getStatus(): ConnectorStatus;
}

export abstract class BaseConnector implements IConnector {
  abstract type: ConnectorType;
  protected lastChecked: Date = new Date();
  protected healthy: boolean = true;

  abstract fetchData(config: ConnectorConfig): Promise<ConnectorResult>;

  async testConnection(_config: ConnectorConfig): Promise<boolean> {
    // simulate connection test with latency
    await this.simulateLatency();
    this.lastChecked = new Date();
    this.healthy = true;
    return true;
  }

  getStatus(): ConnectorStatus {
    return { type: this.type, healthy: this.healthy, lastChecked: this.lastChecked };
  }

  protected simulateLatency(min = 200, max = 800): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min) + min);
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  // ~10% chance of failure for demo purposes
  protected shouldSimulateFailure(): boolean {
    return Math.random() < 0.1;
  }
}
