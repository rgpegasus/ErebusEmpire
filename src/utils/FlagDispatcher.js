import { default as JapaneseFlag } from '@resources/pictures/JapaneseFlag.png';
import { default as FrenchFlag } from '@resources/pictures/FrenchFlag.png';
function FlagDispatcher(language) {
    if (language === "vostfr") {
        return JapaneseFlag;
    } else if (language === "vf") {
        return FrenchFlag;
    }   
    return null;
}

export {FlagDispatcher}