import { convertToCamelCase, convertToSnakeCase } from './object.utils';

describe('Object Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('convertToCamelCase', () => {
    test('should convert a single snake_case object to camelCase', () => {
      const mockData = {
        some_key: 'mock_some_key',
      };

      const result = convertToCamelCase(mockData);

      expect(result).toEqual({
        someKey: 'mock_some_key',
      });
    });

    test('should convert an array of snake_case objects to camelCase', () => {
      const mockData = [
        {
          some_key: 'mock_some_key_1',
        },
        {
          some_key: 'mock_some_key_2',
        },
      ];

      const result = convertToCamelCase(mockData);

      expect(result).toEqual([
        {
          someKey: 'mock_some_key_1',
        },
        {
          someKey: 'mock_some_key_2',
        },
      ]);
    });
  });

  describe('convertToSnakeCase', () => {
    test('should convert a single camelCase object to snake_case', () => {
      const mockData = {
        someKey: 'mock_some_key',
      };

      const result = convertToSnakeCase(mockData);

      expect(result).toEqual({
        some_key: 'mock_some_key',
      });
    });

    test('should convert an array of camelCase objects to snake_case', () => {
      const mockData = [
        {
          someKey: 'mock_some_key_1',
        },
        {
          someKey: 'mock_some_key_2',
        },
      ];

      const result = convertToSnakeCase(mockData);

      expect(result).toEqual([
        {
          some_key: 'mock_some_key_1',
        },
        {
          some_key: 'mock_some_key_2',
        },
      ]);
    });
  });
});
