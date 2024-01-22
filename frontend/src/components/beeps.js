export const beepLogin = () => {
  try {
    let audioFilePath = "./Audiofiles/login.mp3"
    const audio = new Audio(audioFilePath);

    // Set volume to full (1.0)
    audio.volume = 1.0;

    // Play the audio
    audio.play();

    // You may want to perform additional actions after the audio has finished playing
    audio.addEventListener('ended', () => {
      // Additional actions after audio has finished playing
    });

  } catch (e) { }
};
