import node_resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import hotcss from 'rollup-plugin-hot-css';
import static_files from 'rollup-plugin-static-files';
import { terser } from 'rollup-plugin-terser';
import prefresh from '@prefresh/nollup';
import license from 'rollup-plugin-node-license';

let config = {
    input: './src/main.js',
    output: {
        dir: 'dist',
        format: 'esm',
        entryFileNames: '[name].[hash].js',
        assetFileNames: '[name].[hash][extname]'
    },
    plugins: [
        hotcss({
            hot: process.env.NODE_ENV === 'development',
            file: 'styles.css',
            loaders: ['scss']
        }),
        babel({
            exclude: 'node_modules/**'
        }),
        node_resolve(),
        process.env.NODE_ENV === 'development' && prefresh()
    ]
}

if (process.env.NODE_ENV === 'production') {
    config.plugins = config.plugins.concat([
        static_files({
            include: ['./public']
        }),
        license(),
        terser(),
        {
            banner: `
            /*!
                ${require('fs').readFileSync('./LICENSE', 'utf8')}
            */
            `
        }
    ]);
}

export default config;
