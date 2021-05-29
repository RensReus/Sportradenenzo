import _ from "lodash"

export function updateArray(arr: Array<any>, index: number, content: any) {
    var output = _.cloneDeep(arr);
    output[index] = content;
    return output;
}

export function update2DArray(arr: Array<any>, index1: number, index2: number, content: any) {
    var output = _.cloneDeep(arr);
    output[index1][index2] = content;
    return output;
}