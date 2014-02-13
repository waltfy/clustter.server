var summarizer = require('summarizely');

var text = "A massive attack that exploited a key vulnerability in the infrastructure of the internet is the start of ugly things to come, it has been warned. Online security specialists Cloudflare said it recorded the biggest attack of its kind on Monday. Hackers used weaknesses in the Network Time Protocol (NTP), a system used to synchronise computer clocks, to flood servers with huge amounts of data.The technique could potentially be used to force popular services offline. Several experts had predicted that the NTP would be used for malicious purposes. The target of this latest onslaught is unknown, but it was directed at servers in Europe, Cloudflare said. Attackers used a well-known method to bring down a system known as Denial of Service (DoS) - in which huge amounts of data are forced on a target, causing it to fall over. Cloudflare chief executive Matthew Prince said his firm had measured the very big attack at about 400 gigabits per second (Gbps), 100Gbps larger than an attack on anti-spam service Spamhaus last year. In a report published three months ago, Cloudflare warned that attacks on the NTP were on the horizon and gave details of how web hosts could best try to protect their customers. NTP servers, of which there are thousands around the world, are designed to keep computers synchronised to the same time."

var sum = summarizer(text);

console.log(sum);

