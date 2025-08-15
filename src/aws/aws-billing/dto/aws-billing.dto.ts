import { ApiProperty } from '@nestjs/swagger';

class CostAmount {
  @ApiProperty({
    example: '0.0579495744',
    description: 'The numerical value of the cost.',
  })
  Amount: string;

  @ApiProperty({
    example: 'USD',
    description: 'The currency unit of the cost.',
  })
  Unit: string;
}

export class CostAndUsageResponse {
  @ApiProperty({
    description:
      'The total cost for the requested time period, including metrics like BlendedCost.',
    type: Object,
    example: {
      BlendedCost: {
        Amount: '0.0579495744',
        Unit: 'USD',
      },
    },
  })
  TotalCost: any;

  @ApiProperty({
    description: 'The granularity of the cost report (e.g., MONTHLY).',
    example: 'MONTHLY',
  })
  Granularity: 'HOURLY' | 'MONTHLY' | 'DAILY';

  @ApiProperty({
    description: 'The start date of the report in YYYY-MM-DD format.',
    example: '2025-03-01',
  })
  StartDate: string;

  @ApiProperty({
    description: 'The end date of the report in YYYY-MM-DD format.',
    example: '2025-05-01',
  })
  EndDate: string;
}
