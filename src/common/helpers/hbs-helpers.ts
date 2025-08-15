// src/common/helpers/hbs-helpers.ts
import * as hbs from 'hbs';

export function registerHandlebarsHelpers() {
  hbs.registerHelper(
    'selectedAttr',
    function (actual: string, expected: string) {
      return actual === expected ? 'selected' : '';
    },
  );
  hbs.registerHelper('requiredAttr', function (isOptional) {
    return !isOptional ? 'required' : '';
  });
  hbs.registerHelper('checkedAttr', function (value) {
    return value === 'true' ? 'checked' : '';
  });
  /**
   * Compares two values for equality (a == b).
   * Usage: {{#if (ifEquals value1 value2)}} ... {{/if}}
   * Note: This is a simple helper, primarily used as a subexpression within other block helpers like `if`.
   
  hbs.registerHelper('ifEquals', function (arg1: any, arg2: any) {
    return arg1 == arg2; // Simply return true or false
  });*/
  hbs.registerHelper('ifEquals', function (a, b) {
    return a === b;
  });
  /**
   * Checks if the current model is 'user' AND the field is an image-related field.
   * Usage: {{#ifUserImageField modelName fieldName}} ... {{/ifUserImageField}}
   * This is a block helper.
   */
  hbs.registerHelper(
    'ifUserImageField',
    function (model: string, field: string, options: hbs.HelperOptions) {
      const imageFields = ['image', 'avatar', 'profilePicture'];
      return model === 'user' && imageFields.includes(field)
        ? options.fn(this)
        : options.inverse(this);
    },
  );

  /**
   * Capitalizes the first letter of a string.
   * Usage: {{capitalize "hello"}} -> "Hello"
   */
  hbs.registerHelper('capitalize', function (text: string) {
    if (!text || typeof text !== 'string') {
      return ''; // Handle null, undefined, or non-string inputs gracefully
    }
    return text.charAt(0).toUpperCase() + text.slice(1);
  });

  /**
   * Safely looks up a field within an object.
   * Usage: {{lookup myObject "propertyName"}}
   */
  hbs.registerHelper(
    'lookup',
    function (obj: object | undefined | null, field: string) {
      return obj?.[field];
    },
  );

  /**
   * Returns the length of an array or 0 if not an array/null/undefined.
   * Usage: {{length myArray}}
   */
  hbs.registerHelper('length', function (arr: any[] | undefined | null) {
    return arr?.length ?? 0; // Using nullish coalescing operator for conciseness
  });

  /**
   * Adds two numbers.
   * Usage: {{add 5 3}} -> 8
   */
  hbs.registerHelper('add', function (a: number, b: number) {
    return Number(a) + Number(b); // Ensure inputs are treated as numbers
  });

  /**
   * Performs a logical OR operation on multiple arguments.
   * Usage: {{#or condition1 condition2}} ... {{/or}}
   * This is a block helper.
   */
  hbs.registerHelper('or', function (...args: (boolean | hbs.HelperOptions)[]) {
    const options = args.pop() as hbs.HelperOptions;
    // Check if any argument is truthy (excluding the options object)
    return args.some(Boolean) ? options.fn(this) : options.inverse(this);
  });

  /**
   * Performs a logical AND operation on multiple arguments.
   * Usage: {{#and condition1 condition2}} ... {{/and}}
   * This is a block helper.
   */
  hbs.registerHelper(
    'and',
    function (...args: (boolean | hbs.HelperOptions)[]) {
      const options = args.pop() as hbs.HelperOptions;
      // Check if all arguments are truthy (excluding the options object)
      return args.every(Boolean) ? options.fn(this) : options.inverse(this);
    },
  );

  /**
   * Safely encodes a URI component (for URL parameters).
   * Usage: {{encodeURIComponent "path with spaces"}}
   */
  hbs.registerHelper('encodeURIComponent', function (str: string) {
    return encodeURIComponent(str);
  });

  /**
   * Formats a number of bytes into a human-readable string (e.g., "1.2 MB").
   * Usage: {{formatBytes size}} or {{formatBytes size 0}}
   */
  hbs.registerHelper(
    'formatBytes',
    function (bytes: number, decimals: number = 2) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },
  );

  /**
   * Extracts the directory path from a full file path.
   * Usage: {{dirname "/path/to/file.txt"}} -> "/path/to"
   */
  hbs.registerHelper('dirname', function (path: string) {
    const lastSlashIndex = path.lastIndexOf('/');
    if (lastSlashIndex <= 0) {
      return '/'; // For root directory or paths without slashes
    }
    return path.substring(0, lastSlashIndex);
  });
}
