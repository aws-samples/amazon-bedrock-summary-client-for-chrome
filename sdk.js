import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

export default function (request, options, callback) {
  const client = new BedrockRuntimeClient({
    region: "us-west-2",
    credentials: {
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey,
      sessionToken: options.sessionToken
    },
  });
  let prompt = '\n\nHuman: Summary the following text.'
  if (options.regexp) {
    try {
      const reg = new RegExp(options.regexp, 'g');
      const matchArr = request.match(reg);
      prompt = prompt + matchArr.join('');
    } catch (e) {
      prompt = prompt + request;
      console.warn(e);
    }
  } else {
    prompt = prompt + request;
  }
  prompt = prompt + '\n\nAssistant:';
  // prompt size limited
  // prompt = prompt.slice(0, 8192);
  const input = {
    body: JSON.stringify({
      prompt,
      max_tokens_to_sample: 8000,
    }),
    contentType: "application/json",
    accept: "application/json",
    modelId: "anthropic.claude-v2:1",
  };
  const command = new InvokeModelCommand(input);
  client.send(command).then((response) => {
    if (response.body) {
      const result = new TextDecoder().decode(response.body);
      try {
        const jsonResult = JSON.parse(result);
        callback && callback(jsonResult);
      } catch (e) {
        console.warn(e)
      }
    }
  });
}
