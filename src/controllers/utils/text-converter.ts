export interface ITextConverter {
    textOnly(text?: string | null): string;
    numberOnly(text?: string | null): string;
    textAndNumberOnly(text?: string | null): string;
    exceptSpace(text?: string | null): string;
    exceptBeginningAndEndSpace(text?: string | null): string;
}

export class TextConverter implements ITextConverter {
    textOnly = (text?: string | null) => {
        if (!text) {
            return '';
        }
        let check_kor = /[^a-zA-Zㄱ-힣\u119E\u11A2]/gi;
        return text.replace(check_kor, '');
    };
    textAndNumberOnly = (text?: string | null) => {
        if (!text) {
            return '';
        }
        let check_kor = /[^a-zA-Zㄱ-힣\u119E\u11A20-9]/gi;
        return text.replace(check_kor, '');
    };
    numberOnly = (text?: string | null) => {
        if (!text) {
            return '';
        }
        return text.replace(/\D/g, '');
    };

    exceptSpace = (text?: string | null) => {
        if (!text) {
            return '';
        }
        return text.replace(/\s/g, '');
    };
    exceptBeginningAndEndSpace = (text?: string | null) => {
        if (!text) {
            return '';
        }
        return text.replace(/^\s*|\s*$/g, '');
    };
}
