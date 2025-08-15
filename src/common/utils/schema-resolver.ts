import { Type } from '@nestjs/common';
import 'reflect-metadata';
import { getMetadataStorage } from 'class-validator';

export function resolveBasicSchema(dtoClass: Type<unknown>) {
  const schema: Record<string, any> = {
    type: 'object',
    properties: {},
    required: [],
  };

  const instance = Reflect.construct(dtoClass, []) as Record<string, any>;
  const keys = Object.keys(instance);

  const metadataStorage = getMetadataStorage();
  const validationMetadatas = metadataStorage.getTargetValidationMetadatas(
    dtoClass,
    '',
    true,
    false,
  );

  for (const key of keys) {
    const designType = Reflect.getMetadata('design:type', instance, key);
    const typeName = designType?.name?.toLowerCase() ?? 'string';

    const propertySchema: any = { type: typeName };

    const propertyValidations = validationMetadatas.filter(
      (m) => m.propertyName === key,
    );

    const isOptional = propertyValidations.some((v) => v.type === 'isOptional');

    if (!isOptional) {
      schema.required.push(key);
    }

    for (const validation of propertyValidations) {
      switch (validation.type) {
        case 'minLength':
          propertySchema.minLength = validation.constraints?.[0];
          break;
        case 'maxLength':
          propertySchema.maxLength = validation.constraints?.[0];
          break;
        case 'isEmail':
          propertySchema.format = 'email';
          break;
        case 'isUUID':
          propertySchema.format = 'uuid';
          break;
        case 'min':
          propertySchema.minimum = validation.constraints?.[0];
          break;
        case 'max':
          propertySchema.maximum = validation.constraints?.[0];
          break;
        // Extend support as needed
      }
    }

    schema.properties[key] = propertySchema;
  }

  return schema;
}
