import Ajv from 'ajv';
import createHttpError from 'http-errors';
import {IRegexConverter, RegexConverter} from '@controllers/utils/regex-converter';

export interface IBaseValidator {
    execute(schema: object, data: any): void;
    setParameterSchemaError(param: any): void;
}

export class BaseValidator implements IBaseValidator {
    missingProperty?: string;
    notAllowedTypeProperty?: string;
    params?: any;
    keyword?: string;
    allowedValues?: string[];
    regexConverter: IRegexConverter;
    constructor() {
        this.regexConverter = new RegexConverter();
    }
    execute(schema: object, data: any) {
        if (!data) {
            return;
        }
        const ajv = new Ajv({removeAdditional: true, useDefaults: true});
        const isValidate = ajv.validate(schema, data);
        if (!isValidate) {
            const errorMessages = ajv.errorsText();
            let error = !!ajv.errors && !!ajv.errors[0] ? ajv.errors[0] : ajv.errors;
            this.setParameterSchemaError(error);
            throw createHttpError(400, 'Bad Request', {reason: `[Validation Error] ${errorMessages}`, ...error});
        }
    }

    setParameterSchemaError = (err: any) => {
        if (!err) {
            return;
        }
        if (err) {
            const {params, keyword, instancePath} = err;
            this.keyword = keyword;
            if (params) {
                const {missingProperty} = params;
                this.missingProperty = missingProperty;
            }
            if (keyword === 'type' || keyword === 'minLength' || keyword === 'maxLength') {
                this.notAllowedTypeProperty = this.regexConverter.textOnly(instancePath);
                this.params = params;
            }
            if (keyword === 'enum') {
                this.notAllowedTypeProperty = this.regexConverter.textOnly(instancePath);
                this.allowedValues = params.allowedValues;
            }
        }
    };
}
