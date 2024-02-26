import axios from "axios";

// const API_URL = 'https://pzprize-022cf955959c.herokuapp.com';
const API_URL = 'http://localhost:3005';

export const savePdfOnBackend = async (formData) => {
    try {
        const response = await axios.post(`${API_URL}/savePdf`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (response.status === 200) {
            // Backend successfully saved the PDF, retrieve the link
            const { pdfLink } = response.data;
            window.open(pdfLink, '_blank', 'width=600,height=400,resizable=yes,scrollbars=yes');
            return pdfLink;
        } else {
            console.error('Error saving the PDF on the backend:', response.statusText);
            throw new Error('Error saving PDF on the backend');
        }
    } catch (error) {
        console.error('Error saving the PDF on the backend:', error.message);
        throw new Error('Error saving PDF on the backend');
    }
};

export function getPrizeBundlesArray(draw) {
    function isDrawResultPosted(draw) {
        if (draw.prize.firstPrize || draw.prize.secondPrize1 || draw.prize.secondPrize2 || draw.prize.secondPrize3 || draw.prize.secondPrize4 || draw.prize.secondPrize5)
            return true
        return false
    }
    if (!isDrawResultPosted(draw)) {
        return []
    }
    let resultArray = []
    function getFormatArray(prize,tag) {
        const output = [];
        for (let i = 1; i <= prize.length; i++) {
            console.log(prize, prize.substring(0, i))
            output.push([prize.substring(0, i),tag]);
        }
        return output;
    }
    let arrayOfPrizesStr = []
    let { firstPrize, secondPrize1, secondPrize2, secondPrize3, secondPrize4, secondPrize5 } = draw.prize
    if (firstPrize) { 
        resultArray=[...getFormatArray(firstPrize,"f")]
    }

    if (secondPrize1) { arrayOfPrizesStr.push(secondPrize1) }
    if (secondPrize2) { arrayOfPrizesStr.push(secondPrize2) }
    if (secondPrize3) { arrayOfPrizesStr.push(secondPrize3) }
    if (secondPrize4) { arrayOfPrizesStr.push(secondPrize4) }
    if (secondPrize5) { arrayOfPrizesStr.push(secondPrize5) }

    arrayOfPrizesStr.forEach(str => {
        resultArray = [...resultArray, ...getFormatArray(str,"s")]
    })
    
    return resultArray
}

