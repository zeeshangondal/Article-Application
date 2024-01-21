export function formatTime(inputTime) {
    const [hours, minutes] = inputTime.split(':');
    let formattedHours = parseInt(hours, 10);
    let ampm = 'AM';

    if (formattedHours >= 12) {
        formattedHours -= 12;
        ampm = 'PM';
    }

    if (formattedHours === 0) {
        formattedHours = 12;
    }

    const formattedTime = `${formattedHours}:${minutes} ${ampm}`;
    return formattedTime;
}

export function formatDate(inputDate) {
    const months = [
        'Jan.', 'Feb.', 'Mar.', 'Apr.',
        'May', 'Jun.', 'Jul.', 'Aug.',
        'Sep.', 'Oct.', 'Nov.', 'Dec.'
    ];

    const [year, month, day] = inputDate.split('-');
    const monthIndex = parseInt(month, 10) - 1; // Adjust month to be 0-based index

    const formattedDate = `${months[monthIndex]} ${parseInt(day, 10)}, ${year}`;
    return formattedDate;
}

export function formatNumberWithTwoDecimals(inputNumber) {
    // Ensure that the input is a valid number
    if (typeof inputNumber !== 'number' || isNaN(inputNumber)) {
    //   throw new Error('Input is not a valid number');
    return inputNumber
    }
  
    // Use toFixed to round the number to two decimal places
    const formattedNumber = inputNumber.toFixed(2);
  
    // Convert the result back to a number and return
    return Number(formattedNumber);
  }
  