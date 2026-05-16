import { default as JapaneseFlag } from '@resources/pictures/JapaneseFlag.png';
import { default as FrenchFlag } from '@resources/pictures/FrenchFlag.png';
import { default as EnglishFlag } from "@resources/pictures/EnglishFlag.png"
function FlagDispatcher(language) {
    if (language === "vostfr") {
        return JapaneseFlag;
    } else if (language === "vf") {
        return FrenchFlag;
    } else if (language === "va") {
        return EnglishFlag;
    }
    console.log(language)
    return null;
}

export {FlagDispatcher}