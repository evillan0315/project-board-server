import { Injectable } from '@nestjs/common';
import {
  CostExplorerClient,
  GroupDefinition,
  GroupDefinitionType,
  GetCostAndUsageCommand,
  GetCostAndUsageCommandOutput,
} from '@aws-sdk/client-cost-explorer';
import {
  BudgetsClient,
  DescribeBudgetsCommand,
  DescribeBudgetsCommandOutput,
} from '@aws-sdk/client-budgets';
import { ConfigService } from '@nestjs/config';
type Granularity = 'DAILY' | 'MONTHLY' | 'HOURLY';
@Injectable()
export class AwsBillingService {
  private costExplorerClient: CostExplorerClient;
  private budgetsClient: BudgetsClient;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get('AWS_REGION'); // Use region from config
    const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY');

    // Initialize AWS SDK clients with credentials from environment variables
    this.costExplorerClient = new CostExplorerClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.budgetsClient = new BudgetsClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  // Function to fetch cost and usage data
  async getCostAndUsage(
    startDate: string,
    endDate: string,
    granularity: Granularity,
  ) {
    if (!granularity) {
      granularity = 'DAILY';
    }
    const command = new GetCostAndUsageCommand({
      TimePeriod: {
        Start: startDate,
        End: endDate,
      },
      Granularity: granularity, // Granularity can be 'DAILY', 'MONTHLY', or 'HOURLY'
      Metrics: ['BlendedCost'], // You can change metrics to 'UnblendedCost', 'UsageQuantity', etc.
    });

    try {
      const data: GetCostAndUsageCommandOutput =
        await this.costExplorerClient.send(command);

      // Manually handle response data to match expected format
      const resultsByTime = data.ResultsByTime?.[0] ?? {};
      const totalCost = resultsByTime.Total ?? {};
      // Use the command parameters as fallbacks since the response structure might not match expectations

      const breakdown = await this.getCostAndUsageBreakdown(
        startDate,
        endDate,
        granularity,
        'REGION',
      );

      return {
        breakdown,
        totalCost,
        granularity,
        startDate,
        endDate,
      };
    } catch (error) {
      throw new Error(`Error fetching cost and usage data: ${error.message}`);
    }
  }
  async getCostAndUsageBreakdown(
    startDate: string,
    endDate: string,
    granularity: 'DAILY' | 'MONTHLY' | 'HOURLY' = 'MONTHLY',
    groupKey: string = 'SERVICE', // e.g. SERVICE, USAGE_TYPE, REGION
  ): Promise<{
    totalCost: Record<string, any>;
    granularity: string;
    startDate: string;
    endDate: string;
    breakdown: Array<{
      date: string;
      groups: Array<{
        keys: string[];
        amount: string;
        unit: string;
      }>;
    }>;
  }> {
    const groupBy: GroupDefinition[] = [
      {
        Type: 'DIMENSION',
        Key: groupKey,
      },
    ];

    const command = new GetCostAndUsageCommand({
      TimePeriod: {
        Start: startDate,
        End: endDate,
      },
      Granularity: granularity,
      Metrics: ['BlendedCost'],
      GroupBy: groupBy,
    });

    try {
      const data: GetCostAndUsageCommandOutput =
        await this.costExplorerClient.send(command);

      const breakdown = (data.ResultsByTime || []).map((result) => ({
        date: result.TimePeriod?.Start ?? '',
        groups: (result.Groups || []).map((group) => ({
          keys: group.Keys ?? [],
          amount: group.Metrics?.BlendedCost?.Amount ?? '0',
          unit: group.Metrics?.BlendedCost?.Unit ?? 'USD',
        })),
      }));

      const totalCost = data.ResultsByTime?.[0]?.Total ?? {};

      return {
        totalCost,
        granularity,
        startDate,
        endDate,
        breakdown,
      };
    } catch (error: any) {
      throw new Error(
        `Error fetching breakdown of cost and usage: ${error.message}`,
      );
    }
  }
  // Function to fetch budget details
  async getBudgetDetails() {
    const command = new DescribeBudgetsCommand({
      AccountId: this.configService.get('AWS_ACCOUNT_ID'),
    });

    try {
      const data: DescribeBudgetsCommandOutput =
        await this.budgetsClient.send(command);

      return data.Budgets ?? [];
    } catch (error) {
      throw new Error(`Error fetching budget details: ${error.message}`);
    }
  }
}
