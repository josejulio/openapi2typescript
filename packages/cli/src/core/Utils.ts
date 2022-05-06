export const sortByKey = <T>(entries: Array<[string, T]>): Array<[string, T]> => {
    return entries.sort(([ firstKey ], [ secondKey ]) => {
        if (firstKey > secondKey) {
            return 1;
        } else if (secondKey > firstKey) {
            return -1;
        }

        return 0;
    });
};
