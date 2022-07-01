/**
 * * MySQL Query Statement 작성을 함수로 정의
 */

export type JoinType = {
    tableName: string;
    tableShort: string;
    column1: string;
    column2: string;
    condition?: string;
};

export type ConditionType = {
    fieldName: string;
    value: any;
    operator?: string;
    or?: boolean;
    isNewOrGroup?: boolean;
    withColumn?: boolean;
};

export type UpdateQuerySet = {
    fieldName: string;
    value: any;
    operator?: 'plus' | 'minus' | 'set' | 'column';
};

export function bq(str: String): String {
    if (str.indexOf('.') > 1) {
        let str2 = str.split('.');
        return '`' + str2[0] + '`.`' + str2[1] + '`';
    }
    return '`' + str + '`';
}

export function esc(str: any) {
    if (typeof str !== 'string') return str;

    str = str.replace(/[\0\n\r\b\t\\\'\"\x1a]/g, function (res: any) {
        switch (res) {
            case '\0':
                return '\\0';
            case '\n':
                return '\\n';
            case '\r':
                return '\\r';
            case '\b':
                return '\\b';
            case '\t':
                return '\\t';
            case '\x1a':
                return '\\Z';
            default:
                return '\\' + res;
        }
    });
    return "'" + str + "'";
}

export class QueryBuilder {
    _comm: any = '';
    _from: any = '';
    _where: any = '';
    _whereOr: any = '';
    _having: any = '';
    _get: any = '';
    _set: any = '';
    _join: any = '';
    _values: any = '';
    _cols: any = '';
    _on: any = '';
    _duplicate: any = '';
    _qs = "SELECT 'QUERY NOT BUILD'";
    _limit: any = '';
    _order: any = '';
    _group: string = '';

    select(from: String, short?: String) {
        if (this._from) {
            this._from += ', ';
        }
        if (!this._from) {
            this._from = ' FROM ';
        }
        this._comm = 'SELECT ';
        this._from += bq(from);
        if (typeof short !== 'undefined') {
            this._from += ' ' + bq(short);
        }
        return this;
    }

    update(table: String, short?: string) {
        this._comm = 'UPDATE ';
        this._from = bq(table);
        if (typeof short !== 'undefined') {
            this._from += ' ' + bq(short);
        }
        return this;
    }

    insert(table: String, ignore?: boolean) {
        this._comm = 'INSERT ';
        if (ignore) {
            this._from = 'IGNORE INTO ' + bq(table);
        } else {
            this._from = 'INTO ' + bq(table);
        }

        return this;
    }

    delete(table: String, short?: string) {
        this._comm = 'DELETE ';
        this._from = 'FROM ' + bq(table);
        if (typeof short !== 'undefined') {
            this._from = bq(short) + ' ' + this._from + ' ' + bq(short);
        }
        return this;
    }

    join(table: String, columnName: String, operator: String, columnName2: any, tableShort?: string, condition?: string) {
        if (typeof tableShort !== 'undefined') {
            this._join +=
                ' INNER JOIN ' +
                bq(table) +
                ' ' +
                tableShort +
                ' ON ' +
                bq(columnName) +
                ' ' +
                operator +
                ' ' +
                bq(columnName2) +
                (condition ? ' AND ' + condition : '');
        } else {
            this._join += ' INNER JOIN ' + bq(table) + 'ON ' + bq(columnName) + ' ' + operator + ' ' + bq(columnName2);
        }
        return this;
    }

    leftJoin(table: String, columnName: String, operator: String, columnName2: any, tableShort?: string, condition?: string) {
        if (typeof tableShort !== 'undefined') {
            this._join +=
                ' LEFT JOIN ' +
                bq(table) +
                ' ' +
                tableShort +
                ' ON ' +
                bq(columnName) +
                ' ' +
                operator +
                ' ' +
                bq(columnName2) +
                (condition ? ' AND ' + condition : '');
        } else {
            this._join += ' LEFT JOIN ' + bq(table) + 'ON ' + bq(columnName) + ' ' + operator + ' ' + bq(columnName2);
        }
        return this;
    }

    values(values: {}) {
        this._cols += '(';
        Object.keys(values).forEach((key, index) => {
            this._cols += bq(key);
            if (index < Object.keys(values).length - 1) {
                this._cols += ', ';
            }
        });
        this._cols += ')';
        this._values += ' VALUES (';
        Object.keys(values).forEach((key, index) => {
            // @ts-ignore
            let value = values[key];
            if (value === '' || value === undefined) value = null;
            this._values += esc(value);
            if (index < Object.keys(values).length - 1) {
                this._values += ', ';
            }
        });
        this._values += ')';
        return this;
    }

    arrayValues(values: Array<{}>) {
        if (!values[0]) {
            return this.values(values);
        }
        this._cols += '(';
        Object.keys(values[0])
            .sort()
            .forEach((key, index) => {
                this._cols += bq(key);
                if (index < Object.keys(values[0]).length - 1) {
                    this._cols += ', ';
                }
            });
        this._cols += ')';
        this._values += ' VALUES ';
        values.forEach((item: {}, index) => {
            this._values += '(';
            Object.keys(item)
                .sort()
                .forEach((key, index) => {
                    // @ts-ignore
                    let value = item[key];
                    if (value === '' || value === undefined) value = null;
                    this._values += esc(value);
                    if (index < Object.keys(item).length - 1) {
                        this._values += ', ';
                    }
                });
            if (index < values.length - 1) this._values += '),';
            else this._values += ')';
        });

        return this;
    }

    onDuplicate(field: string, value?: any) {
        if (this._duplicate) {
            this._duplicate += ', ';
        } else {
            this._duplicate += ' ON DUPLICATE KEY UPDATE ';
        }
        if (value) {
            this._duplicate += bq(field) + ' = VALUES (' + value + ')';
        } else {
            this._duplicate += bq(field) + ' = VALUES (' + bq(field) + ')';
        }
        return this;
    }

    where(condition: ConditionType) {
        let {operator, withColumn, fieldName, value} = condition;
        if (!fieldName && !value) {
            return ``;
        }
        if (!operator) {
            operator = '=';
        }
        if (this._where) {
            this._where += ' AND ';
        } else {
            this._where += ' WHERE ';
        }
        if (withColumn) {
            this._where += condition.fieldName + ' ' + operator + ' ' + esc(condition.value);
        } else {
            this._where += bq(condition.fieldName) + ' ' + operator + ' ' + esc(condition.value);
        }
        return this;
    }

    whereOr(condition: {operator?: string; isNewOrGroup?: boolean; fieldName: string; value: string}) {
        let {operator, isNewOrGroup, fieldName, value} = condition;
        if (!operator) {
            operator = '=';
        }
        if (this._whereOr) {
            if (isNewOrGroup) {
                this._whereOr += ') AND (';
            } else {
                this._whereOr += ' OR ';
            }
        } else {
            this._whereOr += ' WHERE (';
        }
        this._whereOr += bq(fieldName) + ' ' + operator + ' ' + esc(value);
        return this;
    }

    having(columnName: String, operator: String, value: any) {
        if (!columnName || typeof value === 'undefined') return ``;

        if (this._having) {
            this._having += ' AND ';
        } else {
            this._having += ' HAVING ';
        }
        this._having += bq(columnName) + ' ' + operator + ' ' + esc(value);
        return this;
    }

    limit(limit: number, offset: number) {
        if (!this._limit) {
            this._limit += ' LIMIT ';
        }
        this._limit += offset + ', ' + limit;
        return this;
    }

    updateLimit(limit: Number) {
        if (!this._limit) {
            this._limit += ' LIMIT ' + limit;
        }
        return this;
    }

    orderBy(col: String, sort: String) {
        if (this._order) {
            this._order += ', ';
        } else {
            this._order += ' ORDER BY ';
        }
        this._order += col + ' ' + sort;
        return this;
    }

    groupBy(columnName: String) {
        if (this._group) {
            this._group += ',' + bq(columnName);
        } else {
            this._group += ' GROUP BY ' + bq(columnName);
        }
        return this;
    }

    get(get: any) {
        if (this._get) {
            this._get += ', ';
        }
        // this._get += bq(get);
        this._get += get;
        return this;
    }

    getAs(get: any) {
        if (this._get) {
            this._get += ', ';
        }
        // this._get += bq(get);
        this._get += get;
        return this;
    }

    set(columnName: String, value: any) {
        if (this._set) {
            this._set += ', ';
        } else {
            this._set += ' SET ';
        }
        this._set += bq(columnName) + ' = ' + esc(value);
        return this;
    }

    setMultiple(obj: any) {
        Object.keys(obj).forEach((key) => {
            if (key !== 'uniqueCode' && key !== 'id' && key !== 'customerId' && obj[key] !== undefined) {
                if (this._set) {
                    this._set += ', ';
                } else {
                    this._set += ' SET ';
                }
                let value: any = obj[key];
                if (value === '') {
                    value = null;
                }
                this._set += bq(key) + ' = ' + esc(value);
            }
        });

        return this;
    }

    setMathMultiple(arr: UpdateQuerySet[]) {
        arr.forEach((item) => {
            if (item.fieldName === 'uniqueCode' || item.fieldName === 'idx' || item.fieldName === 'customerId') {
                return;
            }
            if (this._set) {
                this._set += ', ';
            } else {
                this._set += ' SET ';
            }
            if (!item.operator || (item.operator && item.operator === 'set')) {
                this._set += bq(item.fieldName) + ' = ' + esc(item.value);
            }
            if (!item.operator || (item.operator && item.operator === 'column')) {
                this._set += bq(item.fieldName) + ' = ' + bq(item.value);
            }
            if (item.operator && item.operator === 'plus') {
                if (typeof item.value !== 'number') {
                    return;
                }
                this._set += bq(item.fieldName) + ' = ' + bq(item.fieldName) + ' + ' + esc(item.value);
            }
            if (item.operator && item.operator === 'minus') {
                if (typeof item.value !== 'number') {
                    return;
                }
                this._set += bq(item.fieldName) + ' = ' + bq(item.fieldName) + ' - ' + esc(item.value);
            }
        });
        return this;
    }

    build() {
        if (this._comm === 'SELECT ') {
            this._qs =
                this._comm +
                (!this._get ? '*' : this._get) +
                this._from +
                this._join +
                this._on +
                (this._whereOr ? this._whereOr + ')' : '') +
                this.getWhereString(this._where) +
                this._group +
                this._having +
                this._order +
                this._limit +
                ';';
        }
        if (this._comm === 'UPDATE ') {
            this._qs =
                this._comm +
                this._from +
                this._join +
                this._on +
                this._set +
                (this._whereOr ? this._whereOr + ')' : '') +
                this.getWhereString(this._where) +
                this._order +
                this._limit +
                ';';
        }
        if (this._comm === 'INSERT ') {
            this._qs = this._comm + this._from + this._cols + this._values + (this._duplicate ? this._duplicate : '') + ';';
        }
        if (this._comm === 'DELETE ') {
            this._qs = this._comm + this._from + this._join + this._on + (this._where ? this._where : '') + ';';
        }
        return this;
    }

    private getWhereString(where?: string) {
        if (!where) {
            return '';
        }
        if (this._whereOr) {
            return ' AND' + String(this._where).substr(6);
        }
        return this._where;
    }

    returnString() {
        return this._qs;
    }
}
