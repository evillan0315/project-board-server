import { ApiProperty } from '@nestjs/swagger';

export class ColumnMetadataDto {
  @ApiProperty({ example: 'id' })
  column_name: string;

  @ApiProperty({ example: 'integer' })
  data_type: string;

  @ApiProperty({
    example: 'NO',
    description: 'Indicates whether the column is nullable',
  })
  is_nullable: string;

  @ApiProperty({ example: "nextval('users_id_seq'::regclass)", nullable: true })
  column_default: string | null;
}
