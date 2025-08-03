

export const manageDates = {
    conversionDatetoJSDate(date) {
        // Conversion de la date en tableau
        const tab = date.split(/[/ :-]/);

        // Formattage de la date du format DD/MM/YYYY HH:MM:SS en format JS
        if(tab[3] == undefined) {
            return new Date(Date.UTC(tab[2], tab[1]-1, tab[0]));
        } else {
            return new Date(Date.UTC(tab[2], tab[1]-1, tab[0], tab[3], tab[4], tab[5]));
        }
    },
    calculPeriode(start, end) {
        // Conversion du format de date SQL retourné en format JS
        const startDate = manageDates.conversionDatetoJSDate(start);
        const endDate = manageDates.conversionDatetoJSDate(end);

        // Retourne la différence en millisecondes
        return endDate - startDate;
    },
    dhms (ms) {
        const days = Math.floor(ms / (24*60*60*1000));
        const daysms = ms % (24*60*60*1000);
        const hours = Math.floor(daysms / (60*60*1000));
        const hoursms = ms % (60*60*1000);
        const minutes = Math.floor(hoursms / (60*1000));
        const minutesms = ms % (60*1000);
        const sec = Math.floor(minutesms / 1000);
        return {
            days: days,
            hours: hours,
            minutes: minutes,
            seconds: sec
        };
    }, 
    controleFormatDate(date) {
        // Passage de la date en format de tableau
        const tab = date.split(/[/ :-]/);

        // Contrôle des données du tableau
        if(isNaN(tab[0]) || isNaN(tab[1]) || isNaN(tab[2]) || tab[0] < 1 || tab[0] > 31 || tab[1] < 1 || tab[1] > 12 || tab[2] < 1000 || tab[2] > 9999) return false;
        else return true;
    }
};