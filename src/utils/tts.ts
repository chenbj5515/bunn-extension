import {
    SpeechConfig,
    SpeechSynthesizer,
    AudioConfig,
    SpeakerAudioDestination,
} from "microsoft-cognitiveservices-speech-sdk";

export interface TTSOptions {
    voiceName: string;
}

/**
 * 将文本转换为语音并播放
 * @param text 要转换的文本
 * @param options 语音配置选项
 * @param onFinish 语音播放完成后的回调
 */
export const speakText = (text: string, options: TTSOptions, onFinish?: () => void) => {
    // 注意：浏览器扩展中使用环境变量的方式可能需要调整
    const subscriptionKey = process.env.NEXT_PUBLIC_SUBSCRIPTION_KEY;
    const region = process.env.NEXT_PUBLIC_REGION;
    
    if (!subscriptionKey || !region) {
        console.error("缺少语音服务的订阅密钥或区域配置");
        return;
    }

    const speechConfig = SpeechConfig.fromSubscription(
        subscriptionKey,
        region
    );
    
    speechConfig.speechSynthesisVoiceName = options.voiceName;
    speechConfig.speechSynthesisOutputFormat = 8; // AudioOutputFormat.Audio16Khz32KBitRateMonoMp3
    
    const player = new SpeakerAudioDestination();
    const audioConfig = AudioConfig.fromSpeakerOutput(player);

    let synthesizer: SpeechSynthesizer | undefined = new SpeechSynthesizer(
        speechConfig,
        audioConfig
    );

    const complete_cb = function () {
        synthesizer?.close();
        synthesizer = undefined;
    };
    
    const err_cb = function (err: any) {
        console.error("语音合成出错:", err);
        synthesizer?.close();
        synthesizer = undefined;
    };

    player.onAudioEnd = () => {
        synthesizer?.close();
        synthesizer = undefined;
        onFinish?.();
    };

    synthesizer.speakTextAsync(text, complete_cb, err_cb);
}; 