# PRIMERO QUE NADA HACER .ENV

Para crear un nuevo endpoint

# Paso 1:

    Revisar si se trata de una nueva modelo de datos. Por ej: noticias es distinto a declaraciones juradas.

    Dependiendo de eso crear o no un archivo en la carpeta Routes

    Una vez ubicado en el archivo.

    Hacer la ruta, citar al controlador y al metodo de ese controlador

    EJ: router.post("/add-noticia", noticiasController.addNoticia);

# Paso 2:

    Crear el metodo del controlador

    Ej:

        addNoticia: async (req, res, next) => {
            try {
                const { titulo, contenido } = req.body;
                const result = await noticiasModel.addNoticia(titulo, contenido);
                res.json(result);
            } catch (error) {
                next(error);
            }
        },

    Importante mantener estrucutra similar

# Paso 3: 
    Crear la funcion que va a ejecutar el modelo

        addNoticia: async (req, res, next) => {
            try {
                const { titulo, contenido } = req.body;
                const result = await noticiasModel.addNoticia(titulo, contenido);
                res.json(result);
            } catch (error) {
                next(error);
            }
        },

# Paso 4:
Al instalar nodemon(npm install -g nodemon), ejecutamos la api con *nodemon app.js*
```
uesevi-api
├─ .env
├─ .git
│  ├─ COMMIT_EDITMSG
│  ├─ config
│  ├─ description
│  ├─ FETCH_HEAD
│  ├─ HEAD
│  ├─ hooks
│  │  ├─ applypatch-msg.sample
│  │  ├─ commit-msg.sample
│  │  ├─ fsmonitor-watchman.sample
│  │  ├─ post-update.sample
│  │  ├─ pre-applypatch.sample
│  │  ├─ pre-commit.sample
│  │  ├─ pre-merge-commit.sample
│  │  ├─ pre-push.sample
│  │  ├─ pre-rebase.sample
│  │  ├─ pre-receive.sample
│  │  ├─ prepare-commit-msg.sample
│  │  ├─ push-to-checkout.sample
│  │  ├─ sendemail-validate.sample
│  │  └─ update.sample
│  ├─ index
│  ├─ info
│  │  └─ exclude
│  ├─ logs
│  │  ├─ HEAD
│  │  └─ refs
│  │     ├─ heads
│  │     │  ├─ dev
│  │     │  ├─ feature
│  │     │  │  ├─ UES-10
│  │     │  │  ├─ UES-11
│  │     │  │  ├─ UES-12
│  │     │  │  ├─ UES-14
│  │     │  │  ├─ UES-15
│  │     │  │  ├─ UES-16
│  │     │  │  ├─ UES-17
│  │     │  │  ├─ UES-18
│  │     │  │  ├─ UES-20
│  │     │  │  └─ UES-21
│  │     │  └─ main
│  │     └─ remotes
│  │        └─ origin
│  │           ├─ dev
│  │           ├─ feature
│  │           │  ├─ UES-10
│  │           │  ├─ UES-11
│  │           │  ├─ UES-12
│  │           │  ├─ UES-13
│  │           │  ├─ UES-14
│  │           │  ├─ UES-15
│  │           │  ├─ UES-16
│  │           │  ├─ UES-17
│  │           │  ├─ UES-18
│  │           │  ├─ UES-19
│  │           │  ├─ UES-20
│  │           │  └─ UES-21
│  │           └─ main
│  ├─ objects
│  │  ├─ 00
│  │  │  ├─ 1171ef2d0b4f9d437392c0ca3754bc50884710
│  │  │  └─ 3a40286c5a958653e1e45e18bbf1fe815a4aa3
│  │  ├─ 03
│  │  │  └─ 20ba2982d72fd355896049ed028c3f0b327f02
│  │  ├─ 05
│  │  │  └─ 3c1efd5e774b6a473fb67528216392063fe252
│  │  ├─ 06
│  │  │  ├─ 1faeb674b5ce4c00f254fe97ec719042507f12
│  │  │  └─ 55b75a7ba4f7028f4aeab69a66f4f3385a669c
│  │  ├─ 07
│  │  │  └─ 2cbff1478616606670562291e72f932a28bfc6
│  │  ├─ 09
│  │  │  └─ 258a03399748e74009b2161e87f4abb0f86c4c
│  │  ├─ 0a
│  │  │  └─ 1e7cfb47c9f88e11309e42ccfaf2346c928b63
│  │  ├─ 0e
│  │  │  └─ e2f1f06d059393eb0eacac98c50852a8096949
│  │  ├─ 0f
│  │  │  ├─ 7a8765abcf120610ddddbe4770dae8b343561d
│  │  │  ├─ 8f654eb4951678f08e9cf3e49da2c0b525cd0d
│  │  │  └─ 9f9392b1dc6b79010ff2ae96237f71aa927ea4
│  │  ├─ 10
│  │  │  └─ fe90ba592639ae841877924a79c4316b91dca9
│  │  ├─ 11
│  │  │  └─ 09ed53d6c991c501f8e8a3429a7e40bd1a2c6c
│  │  ├─ 12
│  │  │  ├─ 34bb74d1e947cc398a1341147b9809e5ef6341
│  │  │  ├─ bd79f768c9aa85639f9b1a2e04134fb8d605f7
│  │  │  └─ ccb0b6663988f86cdd51f92773b93d98339e88
│  │  ├─ 13
│  │  │  ├─ 77563bcd0354635771ee0f78c5c44e73197791
│  │  │  └─ d05fa3173637b7c5741e4167a2a7ecd83d3280
│  │  ├─ 14
│  │  │  ├─ 02d4aed364da747eea7280c42af03f36e5ca9c
│  │  │  └─ 7fa0c5b0a198e927a1e35f2dd460775f58c040
│  │  ├─ 15
│  │  │  └─ 997134de4bbe0b0adb6a59bc4d43de33ca4ebc
│  │  ├─ 16
│  │  │  ├─ 97f509f9b23602265f961e9f0c8f88d6097f51
│  │  │  └─ ac60111b8d813a069928358f7f20dadfddc23a
│  │  ├─ 17
│  │  │  ├─ 0eafd46e6b93115e5c6383d998185b70ca82ab
│  │  │  ├─ 20addffd986ec87f76e3e1465508d8dffe037b
│  │  │  ├─ 325c1576b61ac23936fd9bd6900b7ad09cec72
│  │  │  └─ a22f3f101426ca56af1d2684df8046fba74f15
│  │  ├─ 18
│  │  │  ├─ b4f9e23a419d5833729898e8d804a7ecf57766
│  │  │  └─ e8e6aa06d1733c13fc7489f64f11d07177e57e
│  │  ├─ 1a
│  │  │  ├─ 5ee0b87fb07c14a5fd69819efe1d012c667d73
│  │  │  ├─ 6f18c05208ea014fdcd9d9061ac9528bf3ffc8
│  │  │  └─ e9d46fa4998c3dc7af6c791320c573a4e7d1f2
│  │  ├─ 1b
│  │  │  ├─ 14ff8d8f65bfa9c69bce3f8c954e606046afb0
│  │  │  ├─ 451e85a665757e2cd46e9f065e7231e64ac882
│  │  │  └─ ebb5ffa10ca92b149289fdc83fcbe7bc03fe29
│  │  ├─ 1c
│  │  │  └─ 26d3c2f3cff599b69bf8ecd0ccbe1dde45207d
│  │  ├─ 1d
│  │  │  ├─ 4300e7ba8b61c6176fe9ea132f17d6466f86cb
│  │  │  └─ cef2d9f2db74bf13c54f973f40239e00717423
│  │  ├─ 1f
│  │  │  ├─ 0431378cb1b982394a1073d2c25a8ea0d11b76
│  │  │  └─ e61e04d79cec5e52d6b29c1c4ea344ac77420c
│  │  ├─ 20
│  │  │  ├─ 49791a82f31d81f35703071173f081a30f9095
│  │  │  └─ ad6428bcae985761c6946a5fee55aace5e1bbf
│  │  ├─ 21
│  │  │  ├─ 86f4502e81f07b087daa42c1fb9ebe761014c2
│  │  │  ├─ dc7ef22e13b4c45cd721f24f956a1cf52d997b
│  │  │  └─ e393d27d0c65803dbfbce0b581cb4c549e895f
│  │  ├─ 22
│  │  │  ├─ 804e7c020132b3584a1a53f5f79f6f37076cd5
│  │  │  └─ c6d8d7d8496c5bd5571484618aaa6afed60e87
│  │  ├─ 23
│  │  │  └─ 4a0c37a11007fe0d561f290945da91be86bfe6
│  │  ├─ 24
│  │  │  ├─ 0e22020255dcbadf20fbbf0dc0cf0fa6f70519
│  │  │  ├─ 28f4711f427f151b636100ba61e02763fa0e8e
│  │  │  └─ 71eb47711219b964eed6a71e8c9c9e6fea64a1
│  │  ├─ 25
│  │  │  └─ ba06bbf4e051b36c87cdd35ee3b3e6f4e65955
│  │  ├─ 27
│  │  │  ├─ d8fd5050ee7721266a07dc348ed7746e3267b1
│  │  │  ├─ f40a6bed1f682de294d144fe2823735c94fe54
│  │  │  └─ f6a73ee04b8f9b4713b814dc36a12f5ce8a4e1
│  │  ├─ 28
│  │  │  ├─ 0845f8d6bdc2191de5bfa768ef9a4ad9158ec0
│  │  │  └─ fe50075a6a4ed3bce9e72f03596a59719b57a4
│  │  ├─ 29
│  │  │  ├─ 3515ef52a8f2c13385311ed11f233865fabfe9
│  │  │  └─ ea34efcd0978fdd7ca8f08f87ab84e20245151
│  │  ├─ 2a
│  │  │  └─ b352583d0e062a85bb52a07ea2466bf9267b0e
│  │  ├─ 2c
│  │  │  ├─ 47e6190e38b78680ed40f078fb3dd4bfcaa5cb
│  │  │  └─ 7554032cedecd64ac3b1b2f06fd11a3c3d113b
│  │  ├─ 2d
│  │  │  └─ 2a84c90e07211db7a262519a84aabfdbd03698
│  │  ├─ 2e
│  │  │  └─ 1cfed9b10f53aacd16a2ed661284c2ccc5ddda
│  │  ├─ 2f
│  │  │  ├─ 309bea15dc59337bcc88d288a132002ec94975
│  │  │  └─ e306460e172a3435f0d19522f2a953461390d1
│  │  ├─ 30
│  │  │  ├─ 2d50b840b407fd06de62e6901562e470abcedd
│  │  │  ├─ 4150147adfef7430764bb1ae79201159d7e046
│  │  │  └─ fd899f28c2ba85bf0cec98e32ba357b3034177
│  │  ├─ 31
│  │  │  ├─ 1f021778463031d9fb8dc6477f738373dbf86f
│  │  │  ├─ 28a014bc3625969da7b9fe6ea55d02d656ffef
│  │  │  └─ 94af6ec6a90848070a62f253f8b5c9c3236d0d
│  │  ├─ 33
│  │  │  └─ 28bba29b734fe4e3459ed137c14bb94d4cc282
│  │  ├─ 34
│  │  │  ├─ 7afa6d27246948b8295421dd3432d8929e35e5
│  │  │  └─ 961f4ef28a815c89e3235a6df89f52fe907435
│  │  ├─ 35
│  │  │  ├─ 1302a465a0c1d2255d9181e616cde2d9f8f9ce
│  │  │  └─ ce6b3bc349ed90b0838db116aa3112e86e6785
│  │  ├─ 36
│  │  │  └─ aaa67f980f46b7855cd74b829b8bdf9987499a
│  │  ├─ 37
│  │  │  └─ cb7ba7e3debaa2e7f6e843cdf9a4088785b0b4
│  │  ├─ 38
│  │  │  └─ 8c927d371f447ca42c7e8f5905bb8c84ee3070
│  │  ├─ 39
│  │  │  └─ df4d821b12be716692d2d228f3632843099b3e
│  │  ├─ 3a
│  │  │  └─ 14ac84f476aebae14124414004224943993812
│  │  ├─ 3b
│  │  │  ├─ 0367acc148f3db0a610a72b7296c87a0a40d10
│  │  │  ├─ 149e8ad2fb86372e3b0d87254cd557ec9df45b
│  │  │  ├─ 57c3f8c6e7ca66640933ce95ec888f71904bc6
│  │  │  └─ 9cf753b3d5cccb6f4b5816c326279e125bb022
│  │  ├─ 3d
│  │  │  ├─ 392438e06a29983ddc57b2f2e1ca32dd5af30a
│  │  │  └─ ba69117ac451d8c29d1b0dad498da9ea6c786a
│  │  ├─ 3e
│  │  │  ├─ 45462be5704b4f4da1a04bda53ab71e3a7243f
│  │  │  └─ 8606c214e857baee35c8f69e24b859d415747a
│  │  ├─ 3f
│  │  │  ├─ 21153c79dc997374f01350c38263fe7d186de1
│  │  │  └─ 552fde07021a8af700f2fbc29a22282f129804
│  │  ├─ 40
│  │  │  ├─ 1907affd99f12295f11ec32a6c67bc72477bd1
│  │  │  ├─ 4f46a91f945de4b5f8b6cb3f1ca4889fe7beca
│  │  │  ├─ 5e469212c55337d4faa4841f9e21b30258a167
│  │  │  └─ a2ba04ebfd85ad89f7bdac4b3de191bcfc0775
│  │  ├─ 41
│  │  │  ├─ 2f06ba2e36ecb587b1e1079d4a25254f26c173
│  │  │  ├─ 765a617ea3afad2515e45a4549ce6af002f276
│  │  │  └─ e236479ecdc2cf93f9a6e98e9cd02528677435
│  │  ├─ 42
│  │  │  └─ 4d277f892d9084c844220dce797343d096af8e
│  │  ├─ 43
│  │  │  └─ 582b5b2cdc03ace354ee808742f351750bf4d8
│  │  ├─ 45
│  │  │  ├─ 5d8817e0975217bf4e8abff9f415bf65e892f8
│  │  │  └─ 984c270ee5ac830a510617ebb6e0be94b76a3f
│  │  ├─ 46
│  │  │  └─ 3ae9ce58b4252be1b46a6b9a8640a491cc4ea4
│  │  ├─ 48
│  │  │  ├─ 52dbcd33771988996b2d99c8a2ae342f20246f
│  │  │  └─ ec87bbba45758ba06342f1b1678e7f1274302c
│  │  ├─ 49
│  │  │  ├─ 7d0a2159a735cbce7f473901b972e7b29f7fab
│  │  │  ├─ 8b73e508c84445f87662ce88f052306b8a84be
│  │  │  └─ 9696bcf1deb6c5bd0557161912d4b84803f3e6
│  │  ├─ 4a
│  │  │  └─ e581526f335f504fba962612f5c210394b1989
│  │  ├─ 4b
│  │  │  └─ 4150971dfcdcec3c7c0c266d7ccba3cb346a88
│  │  ├─ 4d
│  │  │  ├─ 33d0dc55ad8061253c82999a0c3cd8654e2e22
│  │  │  ├─ 83a658b914c088834e5f7783b350bd9be30cc3
│  │  │  ├─ 90e167c47897fa249ca2209840a8ab4801dc94
│  │  │  └─ a02e5e56b227f7ebe592ad5cbcbb13edf6f5b7
│  │  ├─ 50
│  │  │  ├─ 9728d604b14c33a6d455bdb396c2e049cc5a4b
│  │  │  └─ afcebfbf223fdbaf29ea6da16ff345c05d15b2
│  │  ├─ 51
│  │  │  ├─ 093605ec242755dc143cf5431af92195df766f
│  │  │  ├─ 76aa082707a9b8d13663e8005dfb2468721515
│  │  │  ├─ 8fc1d0af799264ff3b9c40df1abdfb816fa556
│  │  │  └─ a4a2e4fb6e598a4158cbd1043dbb9cfbba0a4e
│  │  ├─ 53
│  │  │  └─ 4099bda1ce48eb8d592766203da2ba453949d3
│  │  ├─ 54
│  │  │  └─ a0ef0a15a739851fe4e38a4cbfbfb929ff4f4a
│  │  ├─ 55
│  │  │  ├─ b5c890a3d64d9a121fd7c89de0dca21295aa7d
│  │  │  └─ d52d234c9f481da895d2dfeab78c90e7e12c71
│  │  ├─ 56
│  │  │  ├─ 21edc60ab93e847ac8d63c9193a76609fc1d62
│  │  │  └─ df039bcbbab9475f80b1373572427d5322acd7
│  │  ├─ 57
│  │  │  └─ 8882565c79420e447217df9aa720bdb1b73fbd
│  │  ├─ 58
│  │  │  └─ 4390b9d04ccdd9ab45bf858f0a95401e0d6512
│  │  ├─ 59
│  │  │  ├─ 5c6650cea0d9e014c5c7bff9cda7be030b02a4
│  │  │  ├─ 77054b069faaaa497b35129563866547d24351
│  │  │  └─ 851d56baab129abeaa19a8455da237979de4ab
│  │  ├─ 5b
│  │  │  └─ 3d9de2d6d77bc9330c875dd721afe607814b4f
│  │  ├─ 5c
│  │  │  ├─ 15afd709460d0bfb0dc885a36118589249c07d
│  │  │  ├─ 7c5006662ab3bbb7b60597be8091822e8633d1
│  │  │  ├─ 7dfab410b65768f7e8e9f585d4ad6d8bf8be00
│  │  │  └─ 8eb4a13ac85e8b9f056a38787215bf8fe67ef0
│  │  ├─ 5e
│  │  │  └─ f75b3ece75235e2af6ec742cb00e017d6160a7
│  │  ├─ 5f
│  │  │  ├─ 69b08423920d867149a6d22372653dfdb3f834
│  │  │  ├─ cc751ab45d968558e26a94e02ec3659c4830b0
│  │  │  └─ e67cb1bf87fe8bb14d1eb1497ffc1101a456ef
│  │  ├─ 60
│  │  │  ├─ 49df8e43db8b7af38f9c0749b67d9e857b06d0
│  │  │  ├─ 6e18180b432030f39799747a09d60066257977
│  │  │  └─ 807e9005792886be15c332e4df885e708b358d
│  │  ├─ 62
│  │  │  ├─ 2624b7a1cdf14ca1b0eb8890dedc1f48e55132
│  │  │  ├─ 7b116344fbfa0e3b9241f98e2cde3820d42886
│  │  │  ├─ 83f45c27d23960381eb76231b34b55223e0f86
│  │  │  └─ ff5cbb3bc0e0f8624a7800c48643865089be2d
│  │  ├─ 63
│  │  │  ├─ 5ef9447e9703aba8dae7dc7ac00125ebf1b7c9
│  │  │  ├─ ed3bbde3c2aeee09ffc0ec0646b2a5c5799af8
│  │  │  └─ faa092c232a5b0cf6e826b5cac3bd3bc17e296
│  │  ├─ 65
│  │  │  └─ 61bd62518d6f3a81ff83d9c14bf854e5822e4c
│  │  ├─ 66
│  │  │  ├─ 6880b498fccc313150269b85d498fd0589b802
│  │  │  ├─ 6cf1fba52779e694baeb80c72782ddfd41ff0c
│  │  │  └─ 7f469ba5d8ae4c06141b9eee93f715f3991b65
│  │  ├─ 67
│  │  │  └─ ab878cf25ff8f0d63d1d747c2744e5f4009528
│  │  ├─ 68
│  │  │  └─ 5d7f652b18b5a2a620951e8d49c10144eed52e
│  │  ├─ 69
│  │  │  ├─ 7d9c8fecdb07dfe7b230f0ee832573b4936af4
│  │  │  └─ 8e6ad2552dac4f3c83a8b2bd0232da586ae80e
│  │  ├─ 6a
│  │  │  └─ ab18ee3bee27b49e323577475dcfae171befaf
│  │  ├─ 6b
│  │  │  └─ e815a882bb74709cdf9459db282fe423299343
│  │  ├─ 6c
│  │  │  └─ 1a864a37a9355ebba437a8ca64d192ec13d1bd
│  │  ├─ 6d
│  │  │  └─ 22f12880e31a1ce86253880aa9cbff96dbcde9
│  │  ├─ 6e
│  │  │  └─ af096d71e45a0918c2890503377cb628fd36a7
│  │  ├─ 6f
│  │  │  ├─ 1d4e8af9f5b47c97feaa368075e8118f0ab122
│  │  │  ├─ 1f85994eaef47320786d0aeda06629cd3db1c4
│  │  │  ├─ 5ca7a58f67674735999195126ab9d97e53f289
│  │  │  └─ 961b488d5f3f4e68667b6e60f3d3cc64dabe35
│  │  ├─ 70
│  │  │  └─ 98ef599d0e0a4c615119226f5d17e053791c4c
│  │  ├─ 71
│  │  │  ├─ 1afb7ab1fba541d9bd0cef6baadd2b942da413
│  │  │  └─ e436271f9e120f1e0147a6703d15b7fd4c4d61
│  │  ├─ 73
│  │  │  └─ eb940c5a7970de6aa2e7670b8b27cd6e2083da
│  │  ├─ 74
│  │  │  └─ 9b1711b8d728a066aa60ba0d6590d5f73a2c02
│  │  ├─ 75
│  │  │  └─ f2ecb5e4f3fa42d69b6272f8b7206eb71830ad
│  │  ├─ 76
│  │  │  └─ ed102b351296c1d2174f381522986149c18f04
│  │  ├─ 77
│  │  │  ├─ 0122d131f6a16c1fd112aa2028c2ee4d792619
│  │  │  ├─ 9cdedd89d8122dfa4cb7e2085118e6adfbb3bb
│  │  │  └─ b9a3f641820bf510c871176f801e20a344d08a
│  │  ├─ 78
│  │  │  ├─ 0259f695101e6aa1fd678365dcbcc1dc474ab4
│  │  │  ├─ 29b314950e5ad93b04b4447b35ca869cc2611b
│  │  │  └─ 673f0d7a240e17c12d2867276aaece2f669cd7
│  │  ├─ 7a
│  │  │  └─ 63ec65a8ec8237d6dcc61f1641557278d48e7e
│  │  ├─ 7c
│  │  │  ├─ 1c0d72fa2d9bbe5e385395d1890a92b00c64b1
│  │  │  ├─ 768e4558a4d9cc7ed22a98d5e2da7c6507df7d
│  │  │  └─ e6d7a819c6174871e0fc82bf8f076af9912265
│  │  ├─ 7d
│  │  │  ├─ 8cf1caa3de9d5f799991ff6ef980aa2f39126e
│  │  │  └─ c53a4f5c36974f79f2139f54770abe0f687b18
│  │  ├─ 7e
│  │  │  ├─ 26bea6a7b8d2bd9f58398b5fbcbbf4f94ad1ac
│  │  │  └─ ac36e53a86f4b941fb323e62fe05606b3342ea
│  │  ├─ 7f
│  │  │  ├─ 170d871221c0dbb8fe01a99a7b4b1e2203257f
│  │  │  ├─ 8eb8ca3a7c74211cbb56e6b5c8ae7549807a29
│  │  │  └─ ac91d9683278dbd29ea46103951094c6e6c6cd
│  │  ├─ 80
│  │  │  ├─ 48cdc3568f1e05be8f1d354be7a6e02d1dbe7a
│  │  │  └─ 8578b1cb06821e610810cc593bbdbda2df728e
│  │  ├─ 82
│  │  │  ├─ cff44ab36fca9137f993c0b885f819ddce7774
│  │  │  └─ d8375dc6824eb7a787ebc63b9db1fbd8dc88b0
│  │  ├─ 83
│  │  │  ├─ a6172ed01f4a7dd2637d9c70538aa4ca8c9d1d
│  │  │  └─ d2a43e42f27af4d6b145e4d1b0bdbb98ba4d15
│  │  ├─ 85
│  │  │  ├─ 797becd9f0407a2728be3645985e08a5a0c20c
│  │  │  ├─ 82965254b2aa987e9d65cf3a053adb1aff303a
│  │  │  └─ c98f8f42a863e4bd76f9c2b87fe3ec77dca020
│  │  ├─ 86
│  │  │  ├─ 30f92669625c69456e109547fa20050c58fd66
│  │  │  └─ 5382b4854ef788ad43db1e13d0a1086da76d1f
│  │  ├─ 88
│  │  │  └─ 9845140aabc25627b135ba9e3856f2aa04bea2
│  │  ├─ 8c
│  │  │  └─ e1ba0264f43b340c2cfc60b95b82bee1eefccf
│  │  ├─ 8d
│  │  │  ├─ 2092957a205d3dc9471f7f984f42d3ac5e6f1d
│  │  │  ├─ 54b71ca2edf9ccf7bb278b86b6f2f07e655603
│  │  │  ├─ e8d00225b84cb103860b0d3e3655b690ae4ac7
│  │  │  └─ f8e936cf61462a358e5725ec26d644bf7e4581
│  │  ├─ 8f
│  │  │  ├─ 2e874be1de893610ae8e3c7e53f7c49587e0b3
│  │  │  ├─ 517e5c2ce103a19a1fb2944e062746e967ce53
│  │  │  ├─ 85d8d62359c1202329cca3ca0c44cc94cd579f
│  │  │  ├─ a679d3c52a6548a85ddf3acc456d93a10047da
│  │  │  └─ e04c0f8d2b90b6361618c802be46b2b734acdd
│  │  ├─ 90
│  │  │  └─ af35c2533d0ed90f18a6e9a8cf88261a8b52a1
│  │  ├─ 92
│  │  │  ├─ 10e012c6a1b367d4610811db4fe96076707af8
│  │  │  └─ bc9d1b5c19681cca5c7f0d41fc051228ed8e8e
│  │  ├─ 94
│  │  │  └─ 281871fdc285be71178fb752b3d4edc16404a5
│  │  ├─ 95
│  │  │  └─ 9aef357bf631a659376dff5f490fc418c66b2c
│  │  ├─ 97
│  │  │  ├─ 079b99338cdc8192ad3b68a59dba1e58d3b9e0
│  │  │  ├─ 178534a35b31a9d5a72f51b98fa9a326fce4af
│  │  │  ├─ 2b4ddadd25a38122004d8d8df7839e12b2cc10
│  │  │  ├─ b641b1bcaabe300152f7aacc699866f1d8a8c1
│  │  │  └─ d13aa0e578afe24433b4c21b184a7953e2188c
│  │  ├─ 9a
│  │  │  └─ 65f688cdd2eb68a9ca38285b6d8a65446dd497
│  │  ├─ 9b
│  │  │  ├─ 7081bd734f2be338c128e6e90f70dc4790cb1e
│  │  │  ├─ ca1220e0e8bce6f5a1089f4c89cc77b70a658f
│  │  │  └─ d2ae25e792a970b8115f353ac9ce5c383fff1f
│  │  ├─ 9c
│  │  │  ├─ 25833d1676fccc296dfa7eedf932a174a5a4d0
│  │  │  └─ 54c498ddff3e591b8314c7da579582faeb5889
│  │  ├─ 9d
│  │  │  └─ 13eb8121d325c26050df3a5eb8a8aae7a0092e
│  │  ├─ 9e
│  │  │  └─ 860b5999280b910d54ef02ad6e20bbf7427e24
│  │  ├─ 9f
│  │  │  └─ 9822997f2a4305011e36214d0eb58f750eb512
│  │  ├─ a0
│  │  │  ├─ 0d6f41159794378d6df7c701945b6fc599a2c2
│  │  │  ├─ 5d296677a0dc392cfe4a269578a5b20586642b
│  │  │  └─ e01f620688a79ef164cef9986d6768a2b62bc3
│  │  ├─ a1
│  │  │  ├─ 4bc459fad76397d09be3170cc12ce2064903e4
│  │  │  ├─ 9351a6e88bd466b89041b84566418b5a4c0305
│  │  │  ├─ a3730ee0eefc47784e36a45ef180ce36f2d73e
│  │  │  └─ d1bee38319f5b0b097666db6e1a764bd039b33
│  │  ├─ a3
│  │  │  ├─ 88dc3598cd82a3b86e12decb160ba923c1540e
│  │  │  └─ a139395444da216bc751b97c9bd72182e39207
│  │  ├─ a4
│  │  │  ├─ 118c502dad8a8bc2dbbd2deac587761203603c
│  │  │  ├─ 662366f04964dbad34ea7b01f5a2cf3ee066bc
│  │  │  ├─ cb28c51bafd5d6cd1bfad43fcb0e9383d11cba
│  │  │  └─ efdf7a398687d2c51468acfba3556a7ab96d7e
│  │  ├─ a6
│  │  │  ├─ 45d1f277fb55b7abc04177f0ce2c0bf6908de8
│  │  │  ├─ 65f4a1444175c90c0b8872d905e7d4e87c9342
│  │  │  └─ dbdeadfc145e0d40f6bf961f81941b122bd7d0
│  │  ├─ a7
│  │  │  └─ c53d6870a4a9a9be717bc1fedf238c35355dd0
│  │  ├─ a8
│  │  │  ├─ 28ba0f7637fddbb2ee4379108b87a47115c3ab
│  │  │  └─ e5254af930be4a0da6eb89a46155d1c469b988
│  │  ├─ a9
│  │  │  └─ 80b8c0a883246019ee9b46b25637d000ff67c7
│  │  ├─ aa
│  │  │  └─ 7e84176729f7b898845cc822c5b966657744a9
│  │  ├─ ab
│  │  │  └─ 68788f62074c1d45c13567251fa4083c6e667d
│  │  ├─ ac
│  │  │  └─ 41a919cf8f9562b99d71e9eb0664a8d903d1e1
│  │  ├─ ad
│  │  │  └─ 6fc313896fd949d2cdb0c12e865c7d266aa9d1
│  │  ├─ ae
│  │  │  └─ e448eff95b0ac87c634bb1d7ae7e185a27ab58
│  │  ├─ b0
│  │  │  ├─ 9f579c63fd55a2f2663d18f76da24f8d1ebb3a
│  │  │  └─ db010cb89033a3cf07be522090d24e06c97388
│  │  ├─ b1
│  │  │  └─ 176efd56ac8c4912f1ba85ef5451304dfcf2ed
│  │  ├─ b2
│  │  │  ├─ 1eeecc41f276b95bc1d3f07477fa401936fe8a
│  │  │  ├─ 4dc38565a2f0f410e9d46d0e0765286964dee6
│  │  │  └─ 7596d6f499ec2bec650fc69f6ccb4c2ac0e304
│  │  ├─ b4
│  │  │  └─ 6400416568882ddd918804fc4388264a9be1ea
│  │  ├─ b5
│  │  │  ├─ 0bfe3f4152cb5619e82f36679010ad307792bb
│  │  │  ├─ 12c09d476623ff4bf8d0d63c29b784925dbdf8
│  │  │  ├─ 1f5c54b503c3cffc2310a751873a36873845d1
│  │  │  ├─ 4983307886f90891a8d31f58aaf9b18883ee09
│  │  │  ├─ 9c8296b0a3b69a07e4d93a7546c92dd46060e8
│  │  │  ├─ bb42ca15392a43ccbaf0b8f509352fca204153
│  │  │  └─ efd03e0756ed37abb272128f2d598e284f5a21
│  │  ├─ b6
│  │  │  └─ 61cfb515e94cdd3275aa2a84619ff080ac1147
│  │  ├─ b7
│  │  │  ├─ 0e9d89d291be36fc944371f522ceca042f3313
│  │  │  └─ b36ce45b77a86535b0801a4360149296986185
│  │  ├─ b8
│  │  │  ├─ 1385d93cd5674862bb6d02df5141cb8d53f832
│  │  │  └─ ab3dce0fce34b5784cbb0749d4d0e50a86be75
│  │  ├─ bb
│  │  │  ├─ 0d62450c7da0daac79214aa53fdb5f5a474f5f
│  │  │  ├─ 20a9dbe4fe56012d2a60924e85c26061ce0f3d
│  │  │  ├─ 3066bb97d92cbb77192ac9204ffa09533171a2
│  │  │  └─ 569f026e5ba8a75c7174f6b1dd677fe15fa879
│  │  ├─ bd
│  │  │  ├─ 919bd6446adee10963edb352148e6d732efe39
│  │  │  └─ c5e49419019086220ef1db5b8bab8cc0fa7ece
│  │  ├─ be
│  │  │  └─ 36aea77dd33cab2b15aecc85214a07e3b4a22f
│  │  ├─ bf
│  │  │  ├─ 660cab3bfdd50b1353fc57ffe5ceb310f206b4
│  │  │  ├─ 993b0afc53c6da23ab17ebc64df76ce04d540a
│  │  │  ├─ d5043fffabc2ca9d5e37c19e6a31b66043b8e3
│  │  │  └─ e391cb95eff2e4a93caafe55ecf5032d23482f
│  │  ├─ c1
│  │  │  └─ f89c404c5d20d7d3cff846a2a786c44623a14c
│  │  ├─ c2
│  │  │  ├─ 3900577f514d5a6e5f4f4f43d744dd0050775d
│  │  │  └─ 4840097200224c6bd42bd0b6bdb5871b657829
│  │  ├─ c3
│  │  │  ├─ 6e6010eb9f03afcb79ae0c0e8e72282d9fa160
│  │  │  ├─ 9882fabd02ed5aa1146334678474ce3b9db7fb
│  │  │  ├─ 9c2d9a2e2ec6a2a296aeaffdb01012951cd01b
│  │  │  ├─ bf9630dfc819dc875eec19e7cca926b30f35aa
│  │  │  └─ d111933f89723ecbf0e3c99d842becd622e44c
│  │  ├─ c5
│  │  │  └─ d95a6ecc0ba1e31c6545050e19a958b10ee534
│  │  ├─ c6
│  │  │  ├─ fb3ad13915f29529281f46e64a9da57d0b53d4
│  │  │  └─ fd9766172d7cbcc66733e08ffe47a41299c80e
│  │  ├─ c7
│  │  │  └─ 70a32594de67ae48ad901947e65f8747511faa
│  │  ├─ c8
│  │  │  └─ 9737eef56f44f7975fdb9df385522ede729eb0
│  │  ├─ c9
│  │  │  └─ b09638866fd7f5cc2539e457c4ad4f8e899616
│  │  ├─ cb
│  │  │  ├─ 741657cdd985aa37af1e43f0c4286512473f2f
│  │  │  └─ d210398635f687e76d00fb0bd5a1eacecc67d2
│  │  ├─ cd
│  │  │  ├─ 185351f46fd8a620dcc6eda0a67fdb5ebe071f
│  │  │  └─ 23c1b8a7a0d8cbd272b0191398a81e7c81195c
│  │  ├─ ce
│  │  │  ├─ 2896c84100d53dbaaccd408123148d349c7048
│  │  │  ├─ 30b979bb82fac558b74d1f1d56a141b9f9c61e
│  │  │  └─ 6ca617541be34b4e46623fe55703f10e548272
│  │  ├─ d0
│  │  │  └─ 13c9ae258cd50e58396a0e3e837ac392b8be36
│  │  ├─ d1
│  │  │  └─ aba78a9b8bcf3a1ef993632985555a9c45b9d9
│  │  ├─ d2
│  │  │  ├─ 2f0334bdf2927dbf4664a09a5cecb4042f746e
│  │  │  └─ 960178fd928140eb8875fbd0822d7e36fd1501
│  │  ├─ d3
│  │  │  ├─ b1a3b3a0cb410a01a815972060d1bbc66029bf
│  │  │  └─ f65ac8b9a97e04560e7d63d83304cda6c420e3
│  │  ├─ d4
│  │  │  └─ 709b8ded50ae189b49b409660c064cfeab6164
│  │  ├─ d5
│  │  │  └─ 5bb7b581b2ed8ccfd0948700ebd2aae4ca7035
│  │  ├─ d6
│  │  │  ├─ 2b9e468cb7f183a9a1164adbdb322f45c84e43
│  │  │  └─ a80f4e4c5a9396f90277eac67a9d9cfde9575b
│  │  ├─ d7
│  │  │  ├─ 7b1e69df676ac874e0f8f79df1dd8db2524eb1
│  │  │  ├─ 7b950efcac40e039aa55db1eba0e0b798532d2
│  │  │  └─ e025fd64a3dd54de4a4f8b9cab02003f620a03
│  │  ├─ d8
│  │  │  ├─ 080a3acb5c2bc927488b0625e71191e4fbad5e
│  │  │  ├─ 3fde92f3f35535976ee6edf9196bcff26e1ce7
│  │  │  ├─ 763699c20ecb03644640acfb585c0d27ee0da2
│  │  │  └─ dc3e7e1f167b8e09f46d1a2315c8b3ad3ed2ad
│  │  ├─ d9
│  │  │  └─ 815086285f7661d2cadb4aafe7ac39622a9e8c
│  │  ├─ db
│  │  │  └─ b81147c3591a3f85c3ac24544eb31ff487a79d
│  │  ├─ dc
│  │  │  ├─ 47603f6837a38e3bbed189cb2847690ca6a1cf
│  │  │  └─ 89ef5b1af60903bfa7ce4f12c392e6e5e5d8c9
│  │  ├─ dd
│  │  │  └─ 49937cb6e91e5e05b50d846785f7521d83fd4f
│  │  ├─ e1
│  │  │  ├─ 777ebf79675d18a06b2a9a6f6b2ce880da498b
│  │  │  └─ c0717a6c4b4f3fb77267e03241460b952fa865
│  │  ├─ e2
│  │  │  └─ 2820df176348e5f5e7d57de58c08c1a0a4aa15
│  │  ├─ e3
│  │  │  ├─ 97332634158c07ccd8263ac8d3ef4d9025d03f
│  │  │  └─ d95e518c0d2bfb489f25d8ec9d41897f9fc7cd
│  │  ├─ e4
│  │  │  ├─ 3d4ed2440b85078e2f98834bea24cc5ee5d953
│  │  │  └─ d6f209fdbfff68d423aefc82d545710b50a20e
│  │  ├─ e5
│  │  │  ├─ 8cf6207c9f2d7156d600243a162186cd264375
│  │  │  └─ dc8ad8884b62c7ae5fbe21be2bf0acf985f1ac
│  │  ├─ e6
│  │  │  ├─ 9de29bb2d1d6434b8b29ae775ad8c2e48c5391
│  │  │  ├─ e7f3a1ec15564ba27fba56532db6ad8fe4ce13
│  │  │  ├─ eb520b54388897787d42c26e2c7aa9acdd9550
│  │  │  └─ f1ae369d06ca5ca5fd8226a46464b63ba3aa22
│  │  ├─ e7
│  │  │  ├─ 0fb8411615da6fb045e31a3cee6d1deab9fc89
│  │  │  └─ abb467b01956122ce0193d5cd5718707179f79
│  │  ├─ e8
│  │  │  ├─ c84159029ed93121cea0fb5ae7c00ebc34a9ea
│  │  │  ├─ c974d8b2727d4e12cc5b265b2768a5218f8b72
│  │  │  └─ d431aafe092afb698cb8488c71c859d8da31d3
│  │  ├─ e9
│  │  │  ├─ 93775100d10ee5bfd6b671b3dc2123ed9c7064
│  │  │  └─ b79f8c61490c4538e882a0f4d995cc06588111
│  │  ├─ ea
│  │  │  ├─ 498cb7c3381d0d9541c742407745b14670cd1a
│  │  │  ├─ b32d6befde804fd891c6ec397d5a00e99cea52
│  │  │  └─ e382f213515522098e8fb8eb026256efd671d9
│  │  ├─ eb
│  │  │  └─ 830194e5aa1a4e9968120c884f7ac02e21ae9a
│  │  ├─ ec
│  │  │  └─ cb983232ff1f6c3edacc012b3d34404d087147
│  │  ├─ ed
│  │  │  ├─ 5f56dd6fe729a03fa6db032c7f3a23c643e7ba
│  │  │  └─ d1d95e0382b09259c72ae7fb2b614a30754f1f
│  │  ├─ ee
│  │  │  ├─ 5fc3266bd55ed53bdd75b6875b91743820e011
│  │  │  └─ ae5925557b771510fc1b639fd81e122a127532
│  │  ├─ ef
│  │  │  ├─ 4f5636f6587b7bc03dfa0fbe87524c544038e6
│  │  │  └─ ae8facd0bf8cb766e51452bf17bce224dd4413
│  │  ├─ f0
│  │  │  ├─ 1653b1d69fd848407fdc02992d6741b950d21e
│  │  │  ├─ 29ab1c3dcdcfe29b3b500d58e2d7c6b4911b85
│  │  │  └─ a0d34178719eec6def94ceb783f15aff63ba9e
│  │  ├─ f1
│  │  │  ├─ 39f656ca1a1919592b3c1e97d3da4b821a7f9c
│  │  │  └─ aa545cb8c74ad070dc1ca79afab10a2ea26a35
│  │  ├─ f2
│  │  │  ├─ 2a310326f25225451c7ee734dec42a560ed202
│  │  │  └─ c50db4af36602d33b2268b0dc75f14c5a23b87
│  │  ├─ f3
│  │  │  └─ 8ed7a62b4937f90167e3669753dd2c42c8e86b
│  │  ├─ f4
│  │  │  ├─ 04fec5aa3dfa4808fb2c68b0863c2be3b09be1
│  │  │  ├─ 42fbbe864e979bfa0dffda041a84ebd19d7109
│  │  │  ├─ 49b0173f17c78b768619545320471f1b443b75
│  │  │  └─ d4523e43867a9ed67c739c6f6d590802ca2ecd
│  │  ├─ f5
│  │  │  └─ 6e3b8104f48274d0bfdf1ba5a85a1cac57f3b2
│  │  ├─ f6
│  │  │  └─ 9b4716cf59f7a41c620daffb04618657c4a840
│  │  ├─ f7
│  │  │  └─ 9bab5f5d8090322e12f406746c0a9ca89c4f61
│  │  ├─ f8
│  │  │  ├─ 0007d3d80f142260cdd0a760e4544ef87b4b9d
│  │  │  └─ 5b9b840af3660b35667c0a46f10aa62c7ae193
│  │  ├─ f9
│  │  │  └─ 8ed4a7dc81c43b581f9d797322ecf9be785973
│  │  ├─ fa
│  │  │  └─ 3cd13a46034202613f85a2a985b0839f50e1e5
│  │  ├─ fb
│  │  │  ├─ ad267d875f7a8c977a7bbc8720f4df8745451b
│  │  │  └─ b115b4ec023d71ddc9b2d4d190796c3fe63ada
│  │  ├─ fc
│  │  │  ├─ 3103694955228a6acaab70b562435d88829004
│  │  │  ├─ 5e1486fafe8b97c25b540e183ea96e3be60557
│  │  │  └─ e73512189dda79f1db45dcba8218afe0b3978a
│  │  ├─ fd
│  │  │  ├─ 0cccfa6e3e0e74117b66e94071f645ad661ef0
│  │  │  ├─ 51c58b2e8c49d099d976aae0e34faac8299873
│  │  │  ├─ 62f1fe5f3bef7efc0cd5f31490ee90a7f603f8
│  │  │  ├─ c300aa8862af121b5771c065c830a9174412e3
│  │  │  └─ ee1a1d0387104d73b5a2e5ef28a5ce6ed97ba4
│  │  ├─ fe
│  │  │  └─ f672f64fff2d0ae8e89e9e28152c3f88cc9f32
│  │  ├─ ff
│  │  │  ├─ 139a641646b1aa3292988996ca68fcfc7a09cc
│  │  │  ├─ 48b5691d617bfa4f8733d5d5531da9222a7cce
│  │  │  ├─ be14a9cd05fda8bd41a0246b953b24cc6e0d30
│  │  │  └─ e7ad2428c267a1d044c12ba697a85c49da59f5
│  │  ├─ info
│  │  └─ pack
│  ├─ ORIG_HEAD
│  └─ refs
│     ├─ heads
│     │  ├─ dev
│     │  ├─ feature
│     │  │  ├─ UES-10
│     │  │  ├─ UES-11
│     │  │  ├─ UES-12
│     │  │  ├─ UES-14
│     │  │  ├─ UES-15
│     │  │  ├─ UES-16
│     │  │  ├─ UES-17
│     │  │  ├─ UES-18
│     │  │  ├─ UES-20
│     │  │  └─ UES-21
│     │  └─ main
│     ├─ remotes
│     │  └─ origin
│     │     ├─ dev
│     │     ├─ feature
│     │     │  ├─ UES-10
│     │     │  ├─ UES-11
│     │     │  ├─ UES-12
│     │     │  ├─ UES-13
│     │     │  ├─ UES-14
│     │     │  ├─ UES-15
│     │     │  ├─ UES-16
│     │     │  ├─ UES-17
│     │     │  ├─ UES-18
│     │     │  ├─ UES-19
│     │     │  ├─ UES-20
│     │     │  └─ UES-21
│     │     └─ main
│     └─ tags
├─ .gitignore
├─ app.js
├─ bcrypt_test.js
├─ controllers
│  ├─ adminInfo.js
│  ├─ categorias.js
│  ├─ dashboard.js
│  ├─ declaraciones.js
│  ├─ declaracionesViejas.js
│  ├─ empleados.js
│  ├─ empresas.js
│  ├─ escalasController.js
│  ├─ formulario.js
│  ├─ login.js
│  ├─ noticias.js
│  └─ tasas.js
├─ cronJobs.js
├─ db
│  ├─ config.js
│  └─ db.js
├─ dbconfig.js
├─ models
│  ├─ adminInfoModel.js
│  ├─ categoriasModel.js
│  ├─ dashboardModel.js
│  ├─ declaraciones.js
│  ├─ declaracionesViejasModel.js
│  ├─ empleadosModel.js
│  ├─ empresasModel.js
│  ├─ escalasModel.js
│  ├─ formularioModel.js
│  ├─ loginModel.js
│  ├─ noticiasModel.js
│  └─ tasasModel.js
├─ multerconfig.js
├─ package-lock.json
├─ package.json
├─ pnpm-lock.yaml
├─ README.md
├─ routes
│  ├─ adminInfo.js
│  ├─ categorias.js
│  ├─ dashboard.js
│  ├─ declaraciones.js
│  ├─ declaracionesViejas.js
│  ├─ empleados.js
│  ├─ empresas.js
│  ├─ escalas.js
│  ├─ formulario.js
│  ├─ login.js
│  ├─ noticias.js
│  └─ tasas.js
└─ utils
   └─ utils.js

```