module.exports = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'kryvmind.kryv.network' }],
        destination: 'https://kmnd.kryv.network/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'mind.kryv.network' }],
        destination: 'https://kmnd.kryv.network/:path*',
        permanent: true,
      },
    ]
  },
}
