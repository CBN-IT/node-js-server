/**
 * If val is not an array, return an array with that value
 * @param {Array,String,Null} val
 * @returns Array<String>
 */
function getAsList(val) {
    if(val === null || val === undefined){
        return [];
    }
    return (Array.isArray(val) ? val : [val]);
}


module.exports = getAsList;