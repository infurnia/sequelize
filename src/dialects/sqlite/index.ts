import type { Sequelize } from '../../sequelize.js';
import { createNamedParamBindCollector } from '../../utils/sql';
import { AbstractDialect } from '../abstract';
import { SqliteConnectionManager } from './connection-manager';
import * as DataTypes from './data-types.js';
import { SqliteQuery } from './query';
import { SqliteQueryGenerator } from './query-generator';
import { SqliteQueryInterface } from './query-interface';

export class SqliteDialect extends AbstractDialect {
  static supports = AbstractDialect.extendSupport({
    DEFAULT: false,
    'DEFAULT VALUES': true,
    'UNION ALL': false,
    'RIGHT JOIN': false,
    inserts: {
      ignoreDuplicates: ' OR IGNORE',
      updateOnDuplicate: ' ON CONFLICT DO UPDATE SET',
      conflictFields: true,
    },
    index: {
      using: false,
      where: true,
      functionBased: true,
    },
    transactionOptions: {
      type: true,
    },
    constraints: {
      addConstraint: false,
      dropConstraint: false,
    },
    groupedLimit: false,
    dataTypes: {
      CHAR: false,
      CITEXT: true,
      DECIMAL: false,
      JSON: true,
    },
    // TODO: add support for JSON operations https://www.sqlite.org/json1.html (bundled in sqlite3)
    jsonOperations: false,
    milliseconds: true,
  });

  readonly defaultVersion = '3.8.0';
  readonly Query = SqliteQuery;
  readonly TICK_CHAR = '`';
  readonly TICK_CHAR_LEFT = '`';
  readonly TICK_CHAR_RIGHT = '`';
  readonly connectionManager: SqliteConnectionManager;
  readonly queryGenerator: SqliteQueryGenerator;
  readonly queryInterface: SqliteQueryInterface;
  readonly dataTypesDocumentationUrl = 'https://www.sqlite.org/datatype3.html';

  constructor(sequelize: Sequelize) {
    super(sequelize, DataTypes, 'sqlite');
    this.connectionManager = new SqliteConnectionManager(this, sequelize);
    this.queryGenerator = new SqliteQueryGenerator({
      dialect: this,
      sequelize,
    });

    this.queryInterface = new SqliteQueryInterface(
      sequelize,
      this.queryGenerator,
    );
  }

  createBindCollector() {
    return createNamedParamBindCollector('$');
  }

  static getDefaultPort() {
    return 0;
  }
}