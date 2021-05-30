import _ from "lodash"

export function updateArray(arr: Array<any>, content: any, index1: number, index2 = -1) {
    var output = _.cloneDeep(arr);
    if (index2 !== -1) return update2DArray(arr, content, index1, index2);
    output[index1] = content;
    return output;
}

function update2DArray(arr: Array<any>, content: any, index1: number, index2: number) {
    var output = _.cloneDeep(arr);
    output[index1][index2] = content;
    return output;
}