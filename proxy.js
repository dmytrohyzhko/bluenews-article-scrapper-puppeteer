const proxyString = `
173.208.150.242:15002
173.208.213.170:15002
173.208.239.10:15002
173.208.136.2:15002
195.154.255.118:15002
195.154.222.228:15002
195.154.255.34:15002
195.154.222.26:15002
`;

function getProxies(proxyString_) {
  return (proxyString_ || proxyString)
    .split('\n')
    .filter((value) => value.split(':').length >= 4)
    .map((value) => {
      const [ip, port, username, password] = value.split(':');
      return `http://${username}:${password}@${ip}:${port}`;
    });
}

export default getProxies;
