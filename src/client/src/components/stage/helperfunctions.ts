import _ from "lodash"

export function updateArray(arr: Array<any>, index: number, content: any) {
    var output = _.cloneDeep(arr);
    output[index] = content;
    return output;
}