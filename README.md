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
```
Uesevi-api
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
│  │     │  │  ├─ UES-20
│  │     │  │  ├─ UES-21
│  │     │  │  ├─ UES-22
│  │     │  │  ├─ UES-25
│  │     │  │  ├─ UES-26
│  │     │  │  ├─ UES-27
│  │     │  │  ├─ UES-28
│  │     │  │  ├─ UES-29
│  │     │  │  ├─ UES-30
│  │     │  │  ├─ UES-6
│  │     │  │  └─ UES-7
│  │     │  └─ main
│  │     └─ remotes
│  │        └─ origin
│  │           ├─ dev
│  │           ├─ feature
│  │           │  ├─ UES-20
│  │           │  ├─ UES-21
│  │           │  ├─ UES-22
│  │           │  ├─ UES-25
│  │           │  ├─ UES-26
│  │           │  ├─ UES-27
│  │           │  ├─ UES-28
│  │           │  ├─ UES-29
│  │           │  ├─ UES-30
│  │           │  ├─ UES-40
│  │           │  └─ UES-7
│  │           └─ HEAD
│  ├─ objects
│  │  ├─ 00
│  │  │  └─ b9eb50d3c3bcab140351a5993936a186715747
│  │  ├─ 01
│  │  │  └─ 48589746cc98323552ff5d7906ff2a9befce6b
│  │  ├─ 02
│  │  │  ├─ 6ddbe81e12ea64e36126e768591f3ee349b6c3
│  │  │  └─ ac8aad92f3ee4bb7673fc81c0118dfdbb63558
│  │  ├─ 05
│  │  │  └─ afeb0c3c35751fb032122487246e8ff9139515
│  │  ├─ 06
│  │  │  ├─ 15035bc84851918d85f9619b233e754910847a
│  │  │  ├─ 2bc3dfddd10eb6872387b9097a7115f924875a
│  │  │  └─ c0d170606a946c264c42819d4f7a0770df5a5a
│  │  ├─ 08
│  │  │  └─ d4091fe4f6822a72c8a83b79a3c4815df9eac3
│  │  ├─ 09
│  │  │  └─ c8124bca346dd931c6f8b779b83e6d7c159e41
│  │  ├─ 0c
│  │  │  ├─ fbe43ab489fee2cbdcbe5c53b340604a879957
│  │  │  └─ fde315ce0db7af4887433290820cf5bb66c8e4
│  │  ├─ 0f
│  │  │  ├─ 250e587c40d98a6696275ec525a17ddd6ad7d3
│  │  │  ├─ 72da66b7f4c8401430a9772da1704940a93b24
│  │  │  └─ 7c3e92f4539efd234c59405b4fc16731def2a7
│  │  ├─ 11
│  │  │  └─ b58f2c2fb8bde19493be74dcdf9b8c7670ac9e
│  │  ├─ 12
│  │  │  ├─ cc7d7eaaf0a81add768f1486599b57c740527c
│  │  │  └─ f467d65bf806774518ba5f3d78f0481fd26485
│  │  ├─ 13
│  │  │  └─ 4c5a1f934cca46970ada5b278627d46a18765d
│  │  ├─ 14
│  │  │  └─ 18b70356e47cd1003d522c1a0b6399abfbe70d
│  │  ├─ 15
│  │  │  ├─ 33b143f889843276390b66d1eb69c66140ee7d
│  │  │  └─ cacdcc1b871a09642bc6dc56a97c14e1dc6231
│  │  ├─ 16
│  │  │  ├─ 2b194a1da006dafc61e2ded1c54d3f4545f4ce
│  │  │  └─ 4088dc2d0b2365e4ffd47f182d48955f98d9d1
│  │  ├─ 18
│  │  │  ├─ 329bedbdab29e7e41988d5a8b059922f647392
│  │  │  └─ 388a3e14124b8b6d4af6fd7f9bb7b823f86934
│  │  ├─ 19
│  │  │  └─ 72659db2834c77b6628cd6e972ad1c35e0e589
│  │  ├─ 1a
│  │  │  ├─ 22b7c91cba7374926392ab5924cf7f7fa976fd
│  │  │  ├─ 987630edfde389e3f2b67292d56ca8c660a626
│  │  │  └─ c3c34ec2318bbf0e4447954a9fd516002055c7
│  │  ├─ 1b
│  │  │  ├─ 5938a5fadc889e1b0865895718cfa23750b701
│  │  │  └─ 79a8cc92b9c963093b50c0b06ff6d0455abd01
│  │  ├─ 1c
│  │  │  └─ 9dbf22590951e79824f8d4edda30748c1d8a9d
│  │  ├─ 1d
│  │  │  ├─ 81a6c030f438b1be39b8f3df8d05a19776f474
│  │  │  ├─ ac5ac9f29384768e212abc5efa5860f50d8149
│  │  │  └─ c9dd7a233a4aea716ffae38dbdaf85a352e192
│  │  ├─ 1e
│  │  │  └─ afb6c70b974156f4e7e0d06771ba46ee48d90b
│  │  ├─ 1f
│  │  │  ├─ 3cbc44ec8218ef96a7c9e346e0ce64e116c4a6
│  │  │  └─ 3d3ccffa8d0401a6f9406ff8d274ac60663427
│  │  ├─ 22
│  │  │  └─ f09cbb4e478e615aa1a058b8efffbc78c7ba1a
│  │  ├─ 24
│  │  │  ├─ 62aa5d3fda806598182be5a3f82173e81b9639
│  │  │  ├─ 6957cf3f0dab4893bb2491fc0f905a32298cf9
│  │  │  ├─ 8a6d6af6210ad8ff9ccfdae5a91eba88215747
│  │  │  ├─ 8eea3c97e5ded6c7edbc0fcec4e0ba078c35f4
│  │  │  └─ dc0ee1ac15a2d933f39578617db9b262fb2cea
│  │  ├─ 25
│  │  │  └─ 8725b5f054d8c59310c47dfd7f5e9e56d24606
│  │  ├─ 28
│  │  │  └─ 7d007597afc59ebbfd434905ed98090468eaec
│  │  ├─ 2a
│  │  │  ├─ 2c4051c6af63bd785f332935e2c95c1d04961c
│  │  │  ├─ a973fb62e31b9ed8753eec099938d3ca2e2caa
│  │  │  └─ f1fece36ee4cb73ed370a215af91008d77df42
│  │  ├─ 2b
│  │  │  └─ 38d99d4434e55008215381b73fd59ed08ea182
│  │  ├─ 2f
│  │  │  ├─ a9465c4f8216b757cef91719cfd5bdf3b2dd25
│  │  │  └─ aa7940084c451cdb02373743cfa5c168df6674
│  │  ├─ 30
│  │  │  └─ a0276ad0bc995959346ff55229609fe5055a6f
│  │  ├─ 31
│  │  │  └─ cfd61c0681e7e3c46e55f93c9019e29347eb92
│  │  ├─ 32
│  │  │  └─ 59172e1b62a48609a150ecb5a337f65f014d79
│  │  ├─ 33
│  │  │  └─ f8002feb63640ce622829489d79397d29c1044
│  │  ├─ 34
│  │  │  ├─ 38017e57a84bec6d8a21c55be63157e233cf4a
│  │  │  └─ dd4d4e4af8a86c6554f1439cd229416bb89f5d
│  │  ├─ 35
│  │  │  ├─ 9c648fc80606e0b2b5f6c1b2367e4fb6427d12
│  │  │  └─ bb143ba4bfe01311d490e416e4f6951971286e
│  │  ├─ 36
│  │  │  └─ a34117e4c48889c4b8abf843de5aa2af48d81b
│  │  ├─ 37
│  │  │  └─ 3d2237eaa7c0058df79dc2ca83df3e1034f224
│  │  ├─ 38
│  │  │  └─ 725691c5a43fba3f9721d5033cd77554067da9
│  │  ├─ 39
│  │  │  ├─ 14471e05b9ecabe54713ff050c1af72bc5d273
│  │  │  ├─ 2d8c53190cca426e26c634e7ac04275e7c03e1
│  │  │  └─ a46f8d9789b57f5329274a8cabe1767e22bb0d
│  │  ├─ 3a
│  │  │  ├─ 8e7b1957d01f4a7015746a2db81745824cf7c3
│  │  │  └─ fd0d18ded943c38426ef1eafcc3da4210ebdce
│  │  ├─ 3b
│  │  │  └─ 2cc46a5254e3ea0cb27cc4bcd33648d13dda3c
│  │  ├─ 3c
│  │  │  ├─ 1d47ccb9906c3b8a182e6d0574fc0970836c9d
│  │  │  ├─ 3d8af5838ec00fe5a5ce3a306bf84b46a3a3ed
│  │  │  └─ ae8e1d9284182e3858897320e96cc03a473693
│  │  ├─ 3d
│  │  │  ├─ 4b175d187c111a53bb13800d5096dc7e664b4a
│  │  │  └─ 83e11f464d22e0179e7c2a4c653bb390eae19d
│  │  ├─ 3e
│  │  │  └─ e1d7be2b8507c282423faff9db354ae3e92eee
│  │  ├─ 3f
│  │  │  ├─ 57f85019dce7adb182d752f8b38d8f777721dc
│  │  │  └─ ef3bacca748c6287a729e82b816687dc755981
│  │  ├─ 41
│  │  │  ├─ 0b6b8704ee0ee4664a5b428441eda3ec38f63a
│  │  │  ├─ 25692e85733dda66b05bb1b5305dc599e6bde3
│  │  │  ├─ 3bafea57c593db090b072a5a0c2d61e49c7e57
│  │  │  └─ df785201eb2338bc01c716ba7f6c237b0a4cfd
│  │  ├─ 42
│  │  │  ├─ 2f3f3852fdac71c625951d2eb40fcdb511784d
│  │  │  └─ 7d659f1fd46d3b3a515f3e13d2d70e7b8c1bf7
│  │  ├─ 46
│  │  │  ├─ 1a72c0a3e9c1904a2a0fc84bd395343a6cd1d7
│  │  │  └─ 1cdbafc1768ddf10df1e72515ab260fa55909f
│  │  ├─ 48
│  │  │  ├─ 3c14f2be9c19bcad0371b4af3821650f81baa1
│  │  │  ├─ 7a91feee5a902a6623dda2e1b41e27010e01f7
│  │  │  └─ 9df2951df45be5c4a6852cd07d1dd2f8749d4c
│  │  ├─ 4a
│  │  │  └─ 89d5e83f5921111e8fb548df7c762738370548
│  │  ├─ 4c
│  │  │  ├─ 30c21668bf7e9b00f18954d0a17f65f87bbdd6
│  │  │  ├─ 5abdd443e02267105e169cdb2f48dd681fa8ed
│  │  │  └─ e39ebaa1e953dc1acd1b2ce9ecb01f4aaace96
│  │  ├─ 4e
│  │  │  └─ 56f0643f089dbdbb0f33d4204447eebbec2c2c
│  │  ├─ 51
│  │  │  └─ a6dec71b0a2bef7efe1d3e8e438a90cd6e0f08
│  │  ├─ 52
│  │  │  ├─ 2f48d9b18b8efce0be471fc77d222d3af40f69
│  │  │  └─ e59b625dd9caf26e38b942fe23dd61e1c83a75
│  │  ├─ 53
│  │  │  └─ 7d9acd70e4b610cb49581c3cbb1441ee315d41
│  │  ├─ 54
│  │  │  ├─ 202545970c44c97033d7a933460bfe235a45d7
│  │  │  ├─ 4526d0756a51e496c15d815ac51ce7ad94ce84
│  │  │  └─ bae8d7681667532f233ae705da1f26f4fb0776
│  │  ├─ 55
│  │  │  └─ a3adc82df8730e4cbbf00e04dd508a6c67f789
│  │  ├─ 56
│  │  │  └─ 5048e123b1ebc2f40688074bee51d18d0ebedf
│  │  ├─ 57
│  │  │  ├─ b6ec15f9e8c5882cdd504a910314e0ded30d84
│  │  │  └─ fccfc83085e1e4e2b77a13455f28f79d01f11f
│  │  ├─ 58
│  │  │  └─ 13888a4b9ffb78223c81af2bab444f6f446358
│  │  ├─ 59
│  │  │  ├─ 6a72f8e19eeb3ab0d6a2f1db5c419333881795
│  │  │  └─ ddc5e31ef776a2b468f66cebd57b7e85e7ac6d
│  │  ├─ 5a
│  │  │  └─ 4ba17c27b11925d5578b7d50f2555929556518
│  │  ├─ 5c
│  │  │  └─ 51eaa4e197da23f9900d3f0f2f57e5cd204f08
│  │  ├─ 5d
│  │  │  └─ 5fe5df09a2e39fa00fe7757340dbb40d121371
│  │  ├─ 5e
│  │  │  └─ 69c2641d878c112659eb5037640fcf89a07c94
│  │  ├─ 60
│  │  │  ├─ 76604c44ce8bb0ce9c159f22528fb1dec0b778
│  │  │  └─ c834bea551193f628a31a7ca5aa1e16b043b03
│  │  ├─ 61
│  │  │  ├─ d41505c74849aa0e1d03f2b13ff387c5900f16
│  │  │  └─ f27777403e3568e32db49a04f64371bed1a023
│  │  ├─ 63
│  │  │  ├─ 7bdad7550f88e98addfd5d91210f6b16d54d84
│  │  │  ├─ e97929b7038de57456062149e0ae3dfd82d699
│  │  │  └─ eb0e05026f83fd03e7ba6258c345b002ed6ba6
│  │  ├─ 64
│  │  │  └─ 783f906baaca8b3b5acd1bce180c6359f5d15e
│  │  ├─ 67
│  │  │  └─ f274093ebcfb3167bc3df86f604b7f81105a23
│  │  ├─ 68
│  │  │  ├─ 19020a95e3895b55f5572bae49ecdaf8aaeed0
│  │  │  └─ baf83c5e8983965f58d9a29c992d278d88e66d
│  │  ├─ 69
│  │  │  ├─ 6fd16a5bc9a99abe33d7056beb8cd77590e5e2
│  │  │  └─ b99ba9c8c5205940c4946d21483954fe45f48a
│  │  ├─ 6a
│  │  │  ├─ 4903bb2abcf11b1bf0c2828af18d784910b3ff
│  │  │  ├─ a5195667646c423efa4550e94cd6806aec4c73
│  │  │  └─ fddacb2dea2095ccc4876b9b6f3882d38145ec
│  │  ├─ 6b
│  │  │  └─ be94cc1f353e15c5f86737984a6d7ef4006d0f
│  │  ├─ 6c
│  │  │  ├─ 3ad70e1f49e275840c1c858b8bb4fdeac917f2
│  │  │  ├─ 7d607f4da053bf818c0076be20140528d91297
│  │  │  └─ ece63d931daecab66e0745a9d2626c39195c1d
│  │  ├─ 6d
│  │  │  ├─ 139f81b444f3aa7da624a354e37d1234b69942
│  │  │  └─ 5e6506cd1cf1963e894fbba4a75aef35564d06
│  │  ├─ 6f
│  │  │  ├─ 3b9b6fa8da13052c39214f5106e75f7abf714c
│  │  │  ├─ 8c3d2672dccce46f2793dc2007bc4af6eb63c5
│  │  │  └─ b747321c0af3dfdb8eddea3e3e1c701afa47f4
│  │  ├─ 72
│  │  │  ├─ 0f401a8e69536d811a8055f56fc621542fc1c7
│  │  │  ├─ 848f68661c349b01cbfc6dbb1ea82c7be9a85f
│  │  │  └─ eb77c5542ab42a69e20c42f8c4de0944977969
│  │  ├─ 73
│  │  │  └─ 489779e4033cd6794a233ab789335170ef1e62
│  │  ├─ 75
│  │  │  └─ 7e34fbcf60adafac0caedf155f501bf18f8fe3
│  │  ├─ 77
│  │  │  ├─ 49cc1d8758ec9eec70cbcb5c02fb87a4d45045
│  │  │  └─ 5d5cdd48f3fb4eeb970c1a75b5bbc82a2db793
│  │  ├─ 78
│  │  │  ├─ bc6b6a9823daf8f58ccd9cb7348c74a6e09c9f
│  │  │  └─ d2137f1c53d337842b0eea6e9a0fed2fc61b93
│  │  ├─ 79
│  │  │  └─ b7326ecef9722629e997f6caaea8731f1ee774
│  │  ├─ 7e
│  │  │  ├─ 5171acfdc75c46be0584346694d92643a52272
│  │  │  ├─ 559f77bf7269eeadc4250f96dae620d139852e
│  │  │  ├─ 8e421279e27e4317ea6436c067a2b2ace09280
│  │  │  └─ cf05a5f29fc744a27f9bf9a37beb20ab441b7b
│  │  ├─ 7f
│  │  │  ├─ 3462ba1b1a45df25af4940394c2742785b617b
│  │  │  └─ aac83fd1bd9348421562198fb5d7fc0dcabea6
│  │  ├─ 80
│  │  │  ├─ 7488aad1651c0b00442d496171f61615d13e56
│  │  │  └─ d975bb955e31bc8b34e3f367d7b2ed14abfec0
│  │  ├─ 81
│  │  │  └─ 12b4baed310d52e72636d259442dec0311f063
│  │  ├─ 82
│  │  │  └─ c64869d1a29ed9772d4a5caff1216aa4847be9
│  │  ├─ 84
│  │  │  └─ ddb7c4e057cb5385fdce4e80cf5514288bede9
│  │  ├─ 86
│  │  │  └─ a72d053e8f51383f7414c61617182f7ebc1637
│  │  ├─ 88
│  │  │  └─ 4a7c98ae1c9415c77b6cb3c9047e5aab8d8107
│  │  ├─ 89
│  │  │  ├─ 50f1479eff725a6ffb3107671f5e759f4dfdee
│  │  │  └─ a63caad9222cd3f452a9f82444457f22fcf9ee
│  │  ├─ 8a
│  │  │  └─ a249b8efac9c65ca860fe3f7a782f435b203b2
│  │  ├─ 8b
│  │  │  └─ 34f50b0dd3920a63a56492ddc691eeb8ee714a
│  │  ├─ 8e
│  │  │  └─ 8ce75516caaa3646f87ae2ff589e7f7a5b6852
│  │  ├─ 91
│  │  │  ├─ 7494a33df52645c8192def2322a26afe20c6cb
│  │  │  └─ d2ca79a6632c64955b3f27547b2b635459da46
│  │  ├─ 92
│  │  │  ├─ 50ae66ced261928a773bb84ebc88dfbccf4e71
│  │  │  ├─ bdec0361b14e7bbf1d296e71d12c7b896b8b00
│  │  │  └─ fdbe0e43b77714b020108cdd037b60638efcbd
│  │  ├─ 93
│  │  │  ├─ 141356f25d24b2dffef7f841307ae6dafa39ad
│  │  │  ├─ 54f863344e269c8e8d5a380289d454bd16b82a
│  │  │  └─ ccf137faa23491cef1b069e81529ef7a698fde
│  │  ├─ 94
│  │  │  ├─ 3be79e7f502076c1e819037f89b4f5cd2779cf
│  │  │  └─ 9c9e8edfca9754bb0250188b3de9ecb0d197e7
│  │  ├─ 95
│  │  │  └─ 30dd9cb63d043f5f13d89fe41fb155fbe4d7a6
│  │  ├─ 96
│  │  │  ├─ 2f4acc59fab8254b9f81f04c476808166cd315
│  │  │  └─ 56a5faac158a6a52b6c87195c61f7043de39e2
│  │  ├─ 97
│  │  │  ├─ 0781f657647c94cad36fc5d052abe1f742513a
│  │  │  └─ c591e6900205e6b73928be764861e81ea7c793
│  │  ├─ 98
│  │  │  └─ 0913a8d7c602575d539d9c11120526af4768a8
│  │  ├─ 9a
│  │  │  └─ c670848984582fb894fe79ddba54872897ba7a
│  │  ├─ 9b
│  │  │  ├─ 0cfa9e32e266b43d8bd9d0115740e62338cd4f
│  │  │  ├─ d4f8425fea16693aa5fb0971da98c1ebfc8318
│  │  │  └─ ea56c89fda4a10a38436feca0d4743e22a37f9
│  │  ├─ 9d
│  │  │  ├─ 6d0899c70b0a9655d373c6f94a898653033da3
│  │  │  ├─ 90d7687b11a69688753c5060753df21cac3983
│  │  │  └─ c93c2f0abbacf11412af078f3223bc303c073d
│  │  ├─ 9f
│  │  │  ├─ 0b11b6f55aab9fccb267a72a0836d9df920608
│  │  │  ├─ 20dea11d8ae2ad3d62cde703628bc96214dac7
│  │  │  ├─ 37cebb8be2b742b0eaee309e4d03114e633487
│  │  │  └─ 3ad416e5ad351e16d0bc02b6b8e38792170233
│  │  ├─ a0
│  │  │  ├─ 38a3a07f3302fe4fb8de9a66cca9e3a3a0d804
│  │  │  └─ 5039b548ab5621243216b2e3d46387c308a34f
│  │  ├─ a2
│  │  │  └─ b913c8b569ab20310c1872607c3284d3c5bbc2
│  │  ├─ a3
│  │  │  ├─ 24af5be9d3536513fdad7251783fc08488c866
│  │  │  └─ feefe299d68a3e1cb096679152fd004f048a1e
│  │  ├─ a5
│  │  │  └─ e6af8db7e8c088e45a0ad14c10696037249b49
│  │  ├─ a7
│  │  │  ├─ 0b3955717478a513147240bd4546df0daea6c8
│  │  │  └─ ef6fa5a4643e808ab7ec2cff92bb4e323f461b
│  │  ├─ a8
│  │  │  ├─ 2cf3ec1947ef3c09736e764dd331a69bd0df22
│  │  │  └─ 8dac2f00f96e2b718947db142177011493d451
│  │  ├─ a9
│  │  │  ├─ 4b57b34ce19b77a82181eccd7f4d5eece4b32b
│  │  │  └─ 69f2b23eae92658f031edb90ee9f5a038dc24f
│  │  ├─ aa
│  │  │  ├─ 0d1ceaa4213baf1181bd775c88d0f7e88e7ad8
│  │  │  └─ d128350cc7073e73cc2c24607f03998c9ebb8d
│  │  ├─ ab
│  │  │  └─ e35315f20a11edddcfbfe3e800e8e3bfdc78d3
│  │  ├─ ad
│  │  │  └─ 298f818a2bb534cf11bea3b2f88d4d4da4edab
│  │  ├─ ae
│  │  │  └─ d639659263888c23854139551c1a7e63cf44b9
│  │  ├─ af
│  │  │  ├─ afcf44d85747c3bd0157d454a57abe62353ff1
│  │  │  └─ dcd7579f2df9c7705add18597d41bc396b8c21
│  │  ├─ b0
│  │  │  └─ 0b089a8908f03d5b811c3ee2940f5f153962a4
│  │  ├─ b1
│  │  │  └─ e8f72796d4b1ea0defc3f6e1c4f042be43f3f5
│  │  ├─ b2
│  │  │  ├─ 24f310a72e4e8c9e9206d9464af0abf71be715
│  │  │  ├─ b672c1f6d733bb76fcfb9c65071ac7ca9891b8
│  │  │  ├─ cdc96a62b2489efbe746857656c68bb4f73de3
│  │  │  └─ da0f811afedc0bea230f60f3800f21f31c1a54
│  │  ├─ b3
│  │  │  ├─ b74670ec5120ca260805d8e37803827c653a20
│  │  │  └─ e41f9690aaf54a70e47eb7b3213a1e1a81df8c
│  │  ├─ b4
│  │  │  ├─ 77940000189aefdd34caf61b918335ce642875
│  │  │  └─ 7af4d8402b6906cfcaf02e9aa335f7ee026079
│  │  ├─ b7
│  │  │  ├─ 31f57f7ab7d3fe8bfc34ef3ae2020dbe39cff9
│  │  │  ├─ 36a080156188abf86132cd344fba4739d41dbc
│  │  │  └─ 4062fa61dbd4742f3d93616929df9f5378b6b2
│  │  ├─ b8
│  │  │  └─ 04ecbb9394027fcb1a9fb91f3357c0ce9c141d
│  │  ├─ b9
│  │  │  └─ 049a6fd37f12e413df9a58ce0fd1be1f07ca21
│  │  ├─ bb
│  │  │  ├─ 0264508d3664b076ddfc81a5bf8571cc31322d
│  │  │  └─ 47cf6a690ff0b8a1f406719d8d357742dc14e3
│  │  ├─ bc
│  │  │  ├─ 3199e7728de7e4b9ba688eaddb493d64a74ab8
│  │  │  └─ 3f31727a800544fe2af49bc80dd564ae906049
│  │  ├─ bd
│  │  │  └─ 61ee2ce1a5d29e187a1e803ef19cc208724d3c
│  │  ├─ be
│  │  │  ├─ 7fb7cd0e9db9d29e4a6b375c321ff97e69aebb
│  │  │  └─ e79669373b7958112b38eac10c6475ee2564e0
│  │  ├─ bf
│  │  │  └─ 3a7227197af535e132119ea351e4a6bdd418bd
│  │  ├─ c2
│  │  │  └─ 1856f3ac853f61f84c08634e95cd4d77161bfa
│  │  ├─ c3
│  │  │  └─ 278512512f25b99360c9b239aba0a5e070766f
│  │  ├─ c4
│  │  │  └─ 13b83837f6439cec309017f2e1dc05e89b16af
│  │  ├─ c6
│  │  │  └─ 71d427d79d5ba16f56cd0a1ea131dbb3dc6eca
│  │  ├─ c7
│  │  │  └─ 69893f4f4f1c426d60df96063980637b78e6e1
│  │  ├─ c8
│  │  │  ├─ 0968c0dc2626d6a23fa3fc16c865264ecda27a
│  │  │  └─ 77ef121f494e7634722ec3bf8e97a03fd4b559
│  │  ├─ c9
│  │  │  └─ 1921c3fbeffcaaf4e212208537fbdfa60d5278
│  │  ├─ ca
│  │  │  └─ 79e326035641f5a4f8819c07c6310c2469eafc
│  │  ├─ cb
│  │  │  ├─ 2d2d1c54f13b3a795591ebc25ae7c7ef40a328
│  │  │  └─ 78c3bf036631b36178ac51e643f316e79d5848
│  │  ├─ cc
│  │  │  └─ 6a75432ca505a9abe8c4910ac6f66e6b28a66c
│  │  ├─ cd
│  │  │  └─ 898ae13d9e3a341b3506b39fab47441107518c
│  │  ├─ ce
│  │  │  └─ 1b043990580648b17cf6d6ba391621fa78be99
│  │  ├─ d1
│  │  │  └─ 9e82f100bcf736aab9361a5ebb1cce554bb1b4
│  │  ├─ d2
│  │  │  └─ 37d8d76c8f3ffd8c5538cdd07ab7276b8dc03a
│  │  ├─ d4
│  │  │  └─ c10ddb4d406eccc192c80b099b89d7488e00a9
│  │  ├─ d6
│  │  │  └─ 84870317363491947349ec8f7260ee62305a10
│  │  ├─ d7
│  │  │  ├─ 8cf9c86f79370e9115e05c450c677a4d495fe6
│  │  │  └─ bf766372c82bcde0905a62ee25d73b5a946ed4
│  │  ├─ d8
│  │  │  ├─ 626159aa80f61133cc3cc644c9b4bceb4e57ec
│  │  │  ├─ 9929d752064c6cf4e4911cf7255558466b3bd1
│  │  │  └─ c7c73fbc0d460a8e0155afb725348b2c71f0c7
│  │  ├─ d9
│  │  │  ├─ 4e4acac1b3ea2b2378bd402b4311c5afe65457
│  │  │  └─ 8701b7c58c29f8994bb3ef66d3ae9c265b35ca
│  │  ├─ da
│  │  │  ├─ 269a1cf8a4591a36657dc9748bb0705dca3112
│  │  │  └─ db5eb63e5fb1cf8366aafdab1e2bc7e4e38659
│  │  ├─ db
│  │  │  └─ e0b25f5d1e240ffd573b281a298430e560090b
│  │  ├─ dd
│  │  │  └─ c5139b37b80221836a2983a1ccc86ce81f7785
│  │  ├─ df
│  │  │  ├─ dbd3e709b2aa1941ac7d99dcd1cd6f04374d90
│  │  │  └─ ea328be8292935b67fdd000e3c9e23e99e17be
│  │  ├─ e1
│  │  │  └─ cf427569d3ea916f3130c23d2c9a9bf0f9ebb0
│  │  ├─ e3
│  │  │  └─ de03f8ceed4a6a6a9e1131f77dfc0be202d314
│  │  ├─ e4
│  │  │  └─ 574167a921bb68081dec8092ac6c68ba1f7e72
│  │  ├─ e5
│  │  │  ├─ d8d6c385447cd6ed82ead8d2642737f07cb0dc
│  │  │  └─ e4ded761723925ac5b6c6931fd8d0e3f32ab7b
│  │  ├─ e6
│  │  │  ├─ 4d1428fd0b226a273149ba5a0af99101e95cea
│  │  │  └─ d24a2ab938ec0646f988a6140413c62f40d03e
│  │  ├─ e8
│  │  │  ├─ 6f2871e385b4ea62887f108c1405363bcb70a7
│  │  │  └─ a5867b696d20deac98b1f7fbe836ff888486aa
│  │  ├─ e9
│  │  │  ├─ 7522baa9f6a20ffa70311d404c146a67a1f4c7
│  │  │  └─ b8761d5304c304dec5357058a3a127d74df9e5
│  │  ├─ ea
│  │  │  └─ 90577fac07de47d2b032e8213764f6a08e1d9a
│  │  ├─ eb
│  │  │  └─ f3af1e12101148e29b0911942f83dac0f17f91
│  │  ├─ ed
│  │  │  ├─ 3bbe54d8595336925050c4c08d4e1730490dbf
│  │  │  └─ 4aa8e6715329cf06f4c519e4cef2f608c7f822
│  │  ├─ ee
│  │  │  └─ e5d4cba68d197382ddcc8aa61ad2cedcaf22e0
│  │  ├─ ef
│  │  │  ├─ 3db402ea287fb1291c6c7b75973cde2dcbe05e
│  │  │  ├─ 6dc62534bd4f5bbb81a30bf81bd2bc89b243a3
│  │  │  └─ b41c672df02a3e68d156a135a844b55c97be3f
│  │  ├─ f0
│  │  │  └─ cf1dd5001dca8d210ed7b5de397dca06f6a1f8
│  │  ├─ f2
│  │  │  └─ d62588737561db8f9ccf1bc96c7f4c284f5156
│  │  ├─ f3
│  │  │  ├─ b6a5cc4d9dddce2a95e0771fdba1a75aca6c0a
│  │  │  ├─ df6262be2d0f6931b56c8581598355aa24db30
│  │  │  └─ f6a7ede26d9d665b76e1143da8e9830390e8e9
│  │  ├─ f5
│  │  │  └─ ab9f575b25251666fac5e9a1be9f9d6e426f7c
│  │  ├─ f7
│  │  │  └─ 1a0d76a5bf72f2b022a8dcd6a8c8ab174632f6
│  │  ├─ fb
│  │  │  └─ f330efb390f10366b6aec0b9c06630f39e68db
│  │  ├─ fc
│  │  │  ├─ 4b123816a7b02645603db83b759dd8fac9844d
│  │  │  └─ be9f6ae920b062b3fbe354a876249ab54cf876
│  │  ├─ fe
│  │  │  ├─ b0a6dea64772249d10f74981a4099f8d1424e4
│  │  │  └─ f6a560af3e44c45cd2015a367ff61caf0c740c
│  │  ├─ info
│  │  └─ pack
│  │     ├─ pack-a34e718be3c938fbd45efdc6b77890a0477ab451.idx
│  │     ├─ pack-a34e718be3c938fbd45efdc6b77890a0477ab451.pack
│  │     └─ pack-a34e718be3c938fbd45efdc6b77890a0477ab451.rev
│  ├─ ORIG_HEAD
│  ├─ packed-refs
│  └─ refs
│     ├─ heads
│     │  ├─ dev
│     │  ├─ feature
│     │  │  ├─ UES-20
│     │  │  ├─ UES-21
│     │  │  ├─ UES-22
│     │  │  ├─ UES-25
│     │  │  ├─ UES-26
│     │  │  ├─ UES-27
│     │  │  ├─ UES-28
│     │  │  ├─ UES-29
│     │  │  ├─ UES-30
│     │  │  ├─ UES-6
│     │  │  └─ UES-7
│     │  └─ main
│     ├─ remotes
│     │  └─ origin
│     │     ├─ dev
│     │     ├─ feature
│     │     │  ├─ UES-20
│     │     │  ├─ UES-21
│     │     │  ├─ UES-22
│     │     │  ├─ UES-25
│     │     │  ├─ UES-26
│     │     │  ├─ UES-27
│     │     │  ├─ UES-28
│     │     │  ├─ UES-29
│     │     │  ├─ UES-30
│     │     │  ├─ UES-40
│     │     │  └─ UES-7
│     │     └─ HEAD
│     └─ tags
├─ .gitignore
├─ app.js
├─ bcrypt_test.js
├─ controllers
│  ├─ adminController.js
│  ├─ categoryController.js
│  ├─ companiesController.js
│  ├─ contractsController.js
│  ├─ dashboardController.js
│  ├─ employeesController.js
│  ├─ formController.js
│  ├─ InquiriesController.js
│  ├─ loginController.js
│  ├─ newsController.js
│  ├─ oldCompaniesController.js
│  ├─ oldContractsController.js
│  ├─ oldStatementsController.js
│  ├─ rateController.js
│  ├─ scaleController.js
│  └─ statementsController.js
├─ cronJobs.js
├─ db
│  ├─ config.js
│  └─ db.js
├─ models
│  ├─ adminInfoModel.js
│  ├─ categoryModel.js
│  ├─ companiesModel.js
│  ├─ contractsModel.js
│  ├─ dashboardModel.js
│  ├─ employeesModel.js
│  ├─ formModel.js
│  ├─ inquiriesModel.js
│  ├─ loginModel.js
│  ├─ newsModel.js
│  ├─ oldCompaniesModel.js
│  ├─ oldContractsModel.js
│  ├─ oldStatementsModel.js
│  ├─ rateModel.js
│  ├─ scaleModel.js
│  └─ statementsModel.js
├─ multerconfig.js
├─ package-lock.json
├─ package.json
├─ pnpm-lock.yaml
├─ README.md
├─ routes
│  ├─ adminRoute.js
│  ├─ categoryRoute.js
│  ├─ companiesRoute.js
│  ├─ contractsRoute.js
│  ├─ dashboardRoute.js
│  ├─ employeesRoute.js
│  ├─ formRoute.js
│  ├─ inquiriesRoute.js
│  ├─ loginRoute.js
│  ├─ newsRoute.js
│  ├─ oldCompaniesRoute.js
│  ├─ oldContratsRoute.js
│  ├─ oldStatementsRoute.js
│  ├─ ratesRoute.js
│  ├─ scaleRoute.js
│  └─ statementsRoute.js
├─ uploads
│  ├─ 5cb5c1f61111a.jpeg
│  ├─ 5cb5c1f61111b.jpeg
│  ├─ 5cb5c1f61111c.jpeg
│  ├─ 5cb5c1f61111d.jpeg
│  ├─ 5cb5c1f61111e.jpeg
│  ├─ 5cb5c1f62222a.jpeg
│  ├─ 5cb5c1f62222b.jpeg
│  ├─ 5cb5c1f62222c.jpeg
│  ├─ 5cb5c1f62222d.jpeg
│  ├─ 5cb5c1f63333a.jpeg
│  ├─ 5cb5c1f63333b.jpeg
│  ├─ 5cb5c1f63333c.jpeg
│  ├─ 5cb5c1f63333d.jpeg
│  ├─ 5cb5c1f64444a.jpeg
│  ├─ 5cb5c1f64444b.jpeg
│  ├─ 5cb5c1f64444c.jpeg
│  ├─ 5cb5c1f64444d.jpeg
│  ├─ 5cb5c1f65555a.jpeg
│  ├─ 5cb5c1f65555b.jpeg
│  ├─ 5cb5c1f65555c.jpeg
│  ├─ 5cb5c1f65555d.jpeg
│  ├─ 5cb5c1f66666a.jpeg
│  ├─ 5cb5c1f66666b.jpeg
│  ├─ 5cb5c1f66666c.jpeg
│  ├─ 5cb5c1f66666d.jpeg
│  ├─ 5cb5c1f67777a.jpeg
│  ├─ 5cb5c1f67777b.jpeg
│  ├─ 5cb5c1f67777c.jpeg
│  ├─ 5cb5c1f67777d.jpeg
│  ├─ 5cb5c1f68888a.jpeg
│  ├─ 5cb5c1f68888b.jpeg
│  ├─ 5cb5c1f68888c.jpeg
│  ├─ 5cb5c1f69999a.jpeg
│  ├─ 5cb5c1f69999b.jpeg
│  ├─ 5cb5c1f69999c.jpeg
│  ├─ 61ce428d160c5.jpeg
│  ├─ 61d45b9c84017.png
│  ├─ 61dc4eb032783.jpg
│  ├─ 61f14d121e2d5.jpg
│  ├─ 61f14d5849ce2.jpg
│  ├─ 61faa721863ff.png
│  ├─ 620c16b71560e.jpg
│  ├─ 6210100ab383d.jpg
│  ├─ 6210109277054.jpg
│  ├─ 621010c613ab0.jpg
│  ├─ 621a371c0d179.jpg
│  ├─ 621a371c0f8cf.jpg
│  ├─ 6226219e3fe31.png
│  ├─ 6227fac62001d.jpg
│  ├─ 62289e9035c1d.jpg
│  ├─ 622b781f45c6f.jpeg
│  ├─ 62325d8c2f2d2.jpg
│  ├─ 62432409759db.pdf
│  ├─ 62432d23c7cfc.pdf
│  ├─ 62432d784d049.pdf
│  ├─ 62432effa4f57.pdf
│  ├─ 62432f984baed.pdf
│  ├─ 624331779642f.pdf
│  ├─ 624331bf7ffd7.pdf
│  ├─ 624332337a103.pdf
│  ├─ 624edeff5fc50.jpg
│  ├─ 624edeff94ab4.jpg
│  ├─ 624edeff99020.jpg
│  ├─ 624f7fbb68d4d.png
│  ├─ 62596985bdd2f.jpg
│  ├─ 626b36c08a1ba.jpg
│  ├─ 626e046799835.jpg
│  ├─ 62703e6165edd.png
│  ├─ 628f90ebe843a.docx
│  ├─ 628f915b5c9ec.pdf
│  ├─ 62a7377434c0a.jpg
│  ├─ 62a737744bd78.jpg
│  ├─ 62a7377453945.jpg
│  ├─ 62b5e0b25b0e3.png
│  ├─ 62c2e4815bd95.png
│  ├─ 62c57c29f1b82.jpeg
│  ├─ 62c98bbbaa08c.jpg
│  ├─ 62d06d1a0ac63.png
│  ├─ 62dc31b839f54.png
│  ├─ 62e440678cdbd.jpg
│  ├─ 630775ee30431.jpg
│  ├─ 630775ee33f3f.jpg
│  ├─ 630e756dd82b4.jpg
│  ├─ 6310cf5571b51.jpg
│  ├─ 63121afa411c3.jpg
│  ├─ 631f5037aefc7.jpg
│  ├─ 63247ba95aebc.png
│  ├─ 632dcab05aa88.png
│  ├─ 6330d73cad882.jpg
│  ├─ 6357ff2ebc3e6.jpg
│  ├─ 635bc75f9ecd1.jpg
│  ├─ 6363c0b4c3b67.pdf
│  ├─ 638e680b4a10c.jpg
│  ├─ 63a31c747d071.jpg
│  ├─ 63a5c64032438.jpg
│  ├─ 63aae81999481.jpg
│  ├─ 63ac432c5405d.jpg
│  ├─ 63ac432c55c02.jpg
│  ├─ 63aeddb3d112d.jpg
│  ├─ 63aeddb3dc63f.jpg
│  ├─ 63aeddb3df692.jpg
│  ├─ 63aeddb3e7185.jpg
│  ├─ 63af00f9ec905.pdf
│  ├─ 63af01363873d.pdf
│  ├─ 63b8255edfb7b.pdf
│  ├─ 63c7f8ab4c6af.png
│  ├─ 63e39f088a659.png
│  ├─ 63f8de3a262ef.jpg
│  ├─ 63fe0da24251e.pdf
│  ├─ 642614ddb4c98.pdf
│  ├─ 642615f66021c.png
│  ├─ 644f9ea5c4bd1.png
│  ├─ 645c30b1836c2.jpg
│  ├─ 6495bb11d348d.jpg
│  ├─ 64a58948ece06.jpeg
│  ├─ 64a85d467fb50.jpg
│  ├─ 64a85d4684dad.jpg
│  ├─ 64a85d84d697a.jpg
│  ├─ 64ac2e9a72a66.pdf
│  ├─ 64c846b6747b5.png
│  ├─ 64c846d517c67.png
│  ├─ 64c847149dd5b.pdf
│  ├─ 64fb9d0e22eb4.jpg
│  ├─ 650850a7338ae.png
│  ├─ 652fdfc52a23c.png
│  ├─ 653679841e9ce.jpg
│  ├─ 653950629f9fc.png
│  ├─ 65395062a4f82.png
│  ├─ 654900efc7e28.pdf
│  ├─ 6549011813224.pdf
│  ├─ 656f4628ebb11.png
│  ├─ 65956166b0229.png
│  ├─ 6596ad9c02065.png
│  ├─ 659d4ce4747df.png
│  ├─ 65b11e232684a.pdf
│  ├─ 65b11e6254818.pdf
│  ├─ 65b1207758bf6.jpg
│  ├─ 65e0c7a369254.jpeg
│  ├─ 66022125afeac.pdf
│  ├─ 66022251c75af.jpg
│  ├─ 66022251cd981.jpg
│  ├─ 660ffd1db7e48.png
│  ├─ 66229b47f0d9c.png
│  ├─ 66229cf39da81.pdf
│  ├─ 663b79a023355.jpg
│  ├─ 664fd32e9b596.png
│  ├─ 667f4b556cd6b.jpeg
│  ├─ 6682b4a77a9f1.pdf
│  ├─ 668409fc5b126.pdf
│  ├─ archivos-noticia
│  │  ├─ 62432409759db.pdf
│  │  ├─ 62432d23c7cfc.pdf
│  │  ├─ 62432d784d049.pdf
│  │  ├─ 62432effa4f57.pdf
│  │  ├─ 62432f984baed.pdf
│  │  ├─ 624331779642f.pdf
│  │  ├─ 624331bf7ffd7.pdf
│  │  ├─ 624332337a103.pdf
│  │  ├─ 628f90ebe843a.docx
│  │  ├─ 628f915b5c9ec.pdf
│  │  ├─ 6363c0b4c3b67.pdf
│  │  ├─ 63af00f9ec905.pdf
│  │  ├─ 63af01363873d.pdf
│  │  ├─ 63b8255edfb7b.pdf
│  │  ├─ 63fe0da24251e.pdf
│  │  ├─ 642614ddb4c98.pdf
│  │  ├─ 64ac2e9a72a66.pdf
│  │  ├─ 64c847149dd5b.pdf
│  │  ├─ 654900efc7e28.pdf
│  │  ├─ 6549011813224.pdf
│  │  ├─ 65b11e232684a.pdf
│  │  ├─ 65b11e6254818.pdf
│  │  ├─ 66022125afeac.pdf
│  │  ├─ 66229cf39da81.pdf
│  │  ├─ 668409fc5b126.pdf
│  │  └─ urls.txt
│  ├─ imagenes-noticia
│  │  ├─ 5cb5c1f61111a.jpeg
│  │  ├─ 5cb5c1f61111b.jpeg
│  │  ├─ 5cb5c1f61111c.jpeg
│  │  ├─ 5cb5c1f61111d.jpeg
│  │  ├─ 5cb5c1f61111e.jpeg
│  │  ├─ 5cb5c1f62222a.jpeg
│  │  ├─ 5cb5c1f62222b.jpeg
│  │  ├─ 5cb5c1f62222c.jpeg
│  │  ├─ 5cb5c1f62222d.jpeg
│  │  ├─ 5cb5c1f63333a.jpeg
│  │  ├─ 5cb5c1f63333b.jpeg
│  │  ├─ 5cb5c1f63333c.jpeg
│  │  ├─ 5cb5c1f63333d.jpeg
│  │  ├─ 5cb5c1f64444a.jpeg
│  │  ├─ 5cb5c1f64444b.jpeg
│  │  ├─ 5cb5c1f64444c.jpeg
│  │  ├─ 5cb5c1f64444d.jpeg
│  │  ├─ 5cb5c1f65555a.jpeg
│  │  ├─ 5cb5c1f65555b.jpeg
│  │  ├─ 5cb5c1f65555c.jpeg
│  │  ├─ 5cb5c1f65555d.jpeg
│  │  ├─ 5cb5c1f66666a.jpeg
│  │  ├─ 5cb5c1f66666b.jpeg
│  │  ├─ 5cb5c1f66666c.jpeg
│  │  ├─ 5cb5c1f66666d.jpeg
│  │  ├─ 5cb5c1f67777a.jpeg
│  │  ├─ 5cb5c1f67777b.jpeg
│  │  ├─ 5cb5c1f67777c.jpeg
│  │  ├─ 5cb5c1f67777d.jpeg
│  │  ├─ 5cb5c1f68888a.jpeg
│  │  ├─ 5cb5c1f68888b.jpeg
│  │  ├─ 5cb5c1f68888c.jpeg
│  │  ├─ 5cb5c1f69999a.jpeg
│  │  ├─ 5cb5c1f69999b.jpeg
│  │  ├─ 5cb5c1f69999c.jpeg
│  │  ├─ 61ce428d160c5.jpeg
│  │  ├─ 61d45b9c84017.png
│  │  ├─ 61dc4eb032783.jpg
│  │  ├─ 61f14d121e2d5.jpg
│  │  ├─ 61f14d5849ce2.jpg
│  │  ├─ 61faa721863ff.png
│  │  ├─ 620c16b71560e.jpg
│  │  ├─ 6210100ab383d.jpg
│  │  ├─ 6210109277054.jpg
│  │  ├─ 621010c613ab0.jpg
│  │  ├─ 621a371c0d179.jpg
│  │  ├─ 621a371c0f8cf.jpg
│  │  ├─ 6226219e3fe31.png
│  │  ├─ 6227fac62001d.jpg
│  │  ├─ 62289e9035c1d.jpg
│  │  ├─ 622b781f45c6f.jpeg
│  │  ├─ 62325d8c2f2d2.jpg
│  │  ├─ 624edeff5fc50.jpg
│  │  ├─ 624edeff94ab4.jpg
│  │  ├─ 624edeff99020.jpg
│  │  ├─ 624f7fbb68d4d.png
│  │  ├─ 62596985bdd2f.jpg
│  │  ├─ 626b36c08a1ba.jpg
│  │  ├─ 626e046799835.jpg
│  │  ├─ 62703e6165edd.png
│  │  ├─ 62a7377434c0a.jpg
│  │  ├─ 62a737744bd78.jpg
│  │  ├─ 62a7377453945.jpg
│  │  ├─ 62b5e0b25b0e3.png
│  │  ├─ 62c2e4815bd95.png
│  │  ├─ 62c57c29f1b82.jpeg
│  │  ├─ 62c98bbbaa08c.jpg
│  │  ├─ 62d06d1a0ac63.png
│  │  ├─ 62dc31b839f54.png
│  │  ├─ 62e440678cdbd.jpg
│  │  ├─ 630775ee30431.jpg
│  │  ├─ 630775ee33f3f.jpg
│  │  ├─ 630e756dd82b4.jpg
│  │  ├─ 6310cf5571b51.jpg
│  │  ├─ 63121afa411c3.jpg
│  │  ├─ 631f5037aefc7.jpg
│  │  ├─ 63247ba95aebc.png
│  │  ├─ 632dcab05aa88.png
│  │  ├─ 6330d73cad882.jpg
│  │  ├─ 6357ff2ebc3e6.jpg
│  │  ├─ 635bc75f9ecd1.jpg
│  │  ├─ 638e680b4a10c.jpg
│  │  ├─ 63a31c747d071.jpg
│  │  ├─ 63a5c64032438.jpg
│  │  ├─ 63aae81999481.jpg
│  │  ├─ 63ac432c5405d.jpg
│  │  ├─ 63ac432c55c02.jpg
│  │  ├─ 63aeddb3d112d.jpg
│  │  ├─ 63aeddb3dc63f.jpg
│  │  ├─ 63aeddb3df692.jpg
│  │  ├─ 63aeddb3e7185.jpg
│  │  ├─ 63c7f8ab4c6af.png
│  │  ├─ 63e39f088a659.png
│  │  ├─ 63f8de3a262ef.jpg
│  │  ├─ 642615f66021c.png
│  │  ├─ 644f9ea5c4bd1.png
│  │  ├─ 645c30b1836c2.jpg
│  │  ├─ 6495bb11d348d.jpg
│  │  ├─ 64a58948ece06.jpeg
│  │  ├─ 64a85d467fb50.jpg
│  │  ├─ 64a85d4684dad.jpg
│  │  ├─ 64a85d84d697a.jpg
│  │  ├─ 64c846b6747b5.png
│  │  ├─ 64c846d517c67.png
│  │  ├─ 64fb9d0e22eb4.jpg
│  │  ├─ 650850a7338ae.png
│  │  ├─ 652fdfc52a23c.png
│  │  ├─ 653679841e9ce.jpg
│  │  ├─ 653950629f9fc.png
│  │  ├─ 65395062a4f82.png
│  │  ├─ 656f4628ebb11.png
│  │  ├─ 65956166b0229.png
│  │  ├─ 6596ad9c02065.png
│  │  ├─ 659d4ce4747df.png
│  │  ├─ 65b1207758bf6.jpg
│  │  ├─ 65e0c7a369254.jpeg
│  │  ├─ 66022251c75af.jpg
│  │  ├─ 66022251cd981.jpg
│  │  ├─ 660ffd1db7e48.png
│  │  ├─ 66229b47f0d9c.png
│  │  ├─ 663b79a023355.jpg
│  │  ├─ 664fd32e9b596.png
│  │  └─ urls.txt
│  ├─ urls.txt
│  └─ urlsimg-news.txt
└─ utils
   └─ utils.js

```
```
Uesevi-api
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
│  │     │  │  ├─ UES-20
│  │     │  │  ├─ UES-21
│  │     │  │  ├─ UES-22
│  │     │  │  ├─ UES-25
│  │     │  │  ├─ UES-26
│  │     │  │  ├─ UES-27
│  │     │  │  ├─ UES-28
│  │     │  │  ├─ UES-29
│  │     │  │  ├─ UES-30
│  │     │  │  ├─ UES-6
│  │     │  │  └─ UES-7
│  │     │  └─ main
│  │     └─ remotes
│  │        └─ origin
│  │           ├─ dev
│  │           ├─ feature
│  │           │  ├─ UES-20
│  │           │  ├─ UES-21
│  │           │  ├─ UES-22
│  │           │  ├─ UES-25
│  │           │  ├─ UES-26
│  │           │  ├─ UES-27
│  │           │  ├─ UES-28
│  │           │  ├─ UES-29
│  │           │  ├─ UES-30
│  │           │  ├─ UES-40
│  │           │  └─ UES-7
│  │           └─ HEAD
│  ├─ objects
│  │  ├─ 00
│  │  │  └─ b9eb50d3c3bcab140351a5993936a186715747
│  │  ├─ 01
│  │  │  └─ 48589746cc98323552ff5d7906ff2a9befce6b
│  │  ├─ 02
│  │  │  ├─ 6ddbe81e12ea64e36126e768591f3ee349b6c3
│  │  │  └─ ac8aad92f3ee4bb7673fc81c0118dfdbb63558
│  │  ├─ 05
│  │  │  └─ afeb0c3c35751fb032122487246e8ff9139515
│  │  ├─ 06
│  │  │  ├─ 15035bc84851918d85f9619b233e754910847a
│  │  │  ├─ 2bc3dfddd10eb6872387b9097a7115f924875a
│  │  │  └─ c0d170606a946c264c42819d4f7a0770df5a5a
│  │  ├─ 08
│  │  │  └─ d4091fe4f6822a72c8a83b79a3c4815df9eac3
│  │  ├─ 09
│  │  │  └─ c8124bca346dd931c6f8b779b83e6d7c159e41
│  │  ├─ 0c
│  │  │  ├─ fbe43ab489fee2cbdcbe5c53b340604a879957
│  │  │  └─ fde315ce0db7af4887433290820cf5bb66c8e4
│  │  ├─ 0f
│  │  │  ├─ 250e587c40d98a6696275ec525a17ddd6ad7d3
│  │  │  ├─ 72da66b7f4c8401430a9772da1704940a93b24
│  │  │  └─ 7c3e92f4539efd234c59405b4fc16731def2a7
│  │  ├─ 11
│  │  │  └─ b58f2c2fb8bde19493be74dcdf9b8c7670ac9e
│  │  ├─ 12
│  │  │  ├─ cc7d7eaaf0a81add768f1486599b57c740527c
│  │  │  └─ f467d65bf806774518ba5f3d78f0481fd26485
│  │  ├─ 13
│  │  │  └─ 4c5a1f934cca46970ada5b278627d46a18765d
│  │  ├─ 14
│  │  │  └─ 18b70356e47cd1003d522c1a0b6399abfbe70d
│  │  ├─ 15
│  │  │  ├─ 33b143f889843276390b66d1eb69c66140ee7d
│  │  │  └─ cacdcc1b871a09642bc6dc56a97c14e1dc6231
│  │  ├─ 16
│  │  │  ├─ 2b194a1da006dafc61e2ded1c54d3f4545f4ce
│  │  │  └─ 4088dc2d0b2365e4ffd47f182d48955f98d9d1
│  │  ├─ 18
│  │  │  ├─ 329bedbdab29e7e41988d5a8b059922f647392
│  │  │  └─ 388a3e14124b8b6d4af6fd7f9bb7b823f86934
│  │  ├─ 19
│  │  │  └─ 72659db2834c77b6628cd6e972ad1c35e0e589
│  │  ├─ 1a
│  │  │  ├─ 22b7c91cba7374926392ab5924cf7f7fa976fd
│  │  │  ├─ 987630edfde389e3f2b67292d56ca8c660a626
│  │  │  └─ c3c34ec2318bbf0e4447954a9fd516002055c7
│  │  ├─ 1b
│  │  │  ├─ 5938a5fadc889e1b0865895718cfa23750b701
│  │  │  └─ 79a8cc92b9c963093b50c0b06ff6d0455abd01
│  │  ├─ 1c
│  │  │  └─ 9dbf22590951e79824f8d4edda30748c1d8a9d
│  │  ├─ 1d
│  │  │  ├─ 81a6c030f438b1be39b8f3df8d05a19776f474
│  │  │  ├─ ac5ac9f29384768e212abc5efa5860f50d8149
│  │  │  └─ c9dd7a233a4aea716ffae38dbdaf85a352e192
│  │  ├─ 1e
│  │  │  └─ afb6c70b974156f4e7e0d06771ba46ee48d90b
│  │  ├─ 1f
│  │  │  ├─ 3cbc44ec8218ef96a7c9e346e0ce64e116c4a6
│  │  │  └─ 3d3ccffa8d0401a6f9406ff8d274ac60663427
│  │  ├─ 22
│  │  │  └─ f09cbb4e478e615aa1a058b8efffbc78c7ba1a
│  │  ├─ 24
│  │  │  ├─ 62aa5d3fda806598182be5a3f82173e81b9639
│  │  │  ├─ 6957cf3f0dab4893bb2491fc0f905a32298cf9
│  │  │  ├─ 8a6d6af6210ad8ff9ccfdae5a91eba88215747
│  │  │  ├─ 8eea3c97e5ded6c7edbc0fcec4e0ba078c35f4
│  │  │  └─ dc0ee1ac15a2d933f39578617db9b262fb2cea
│  │  ├─ 25
│  │  │  └─ 8725b5f054d8c59310c47dfd7f5e9e56d24606
│  │  ├─ 28
│  │  │  └─ 7d007597afc59ebbfd434905ed98090468eaec
│  │  ├─ 2a
│  │  │  ├─ 2c4051c6af63bd785f332935e2c95c1d04961c
│  │  │  ├─ a973fb62e31b9ed8753eec099938d3ca2e2caa
│  │  │  └─ f1fece36ee4cb73ed370a215af91008d77df42
│  │  ├─ 2b
│  │  │  └─ 38d99d4434e55008215381b73fd59ed08ea182
│  │  ├─ 2f
│  │  │  ├─ a9465c4f8216b757cef91719cfd5bdf3b2dd25
│  │  │  └─ aa7940084c451cdb02373743cfa5c168df6674
│  │  ├─ 30
│  │  │  └─ a0276ad0bc995959346ff55229609fe5055a6f
│  │  ├─ 31
│  │  │  └─ cfd61c0681e7e3c46e55f93c9019e29347eb92
│  │  ├─ 32
│  │  │  └─ 59172e1b62a48609a150ecb5a337f65f014d79
│  │  ├─ 33
│  │  │  └─ f8002feb63640ce622829489d79397d29c1044
│  │  ├─ 34
│  │  │  ├─ 38017e57a84bec6d8a21c55be63157e233cf4a
│  │  │  └─ dd4d4e4af8a86c6554f1439cd229416bb89f5d
│  │  ├─ 35
│  │  │  ├─ 9c648fc80606e0b2b5f6c1b2367e4fb6427d12
│  │  │  └─ bb143ba4bfe01311d490e416e4f6951971286e
│  │  ├─ 36
│  │  │  └─ a34117e4c48889c4b8abf843de5aa2af48d81b
│  │  ├─ 37
│  │  │  └─ 3d2237eaa7c0058df79dc2ca83df3e1034f224
│  │  ├─ 38
│  │  │  └─ 725691c5a43fba3f9721d5033cd77554067da9
│  │  ├─ 39
│  │  │  ├─ 14471e05b9ecabe54713ff050c1af72bc5d273
│  │  │  ├─ 2d8c53190cca426e26c634e7ac04275e7c03e1
│  │  │  └─ a46f8d9789b57f5329274a8cabe1767e22bb0d
│  │  ├─ 3a
│  │  │  ├─ 8e7b1957d01f4a7015746a2db81745824cf7c3
│  │  │  └─ fd0d18ded943c38426ef1eafcc3da4210ebdce
│  │  ├─ 3b
│  │  │  └─ 2cc46a5254e3ea0cb27cc4bcd33648d13dda3c
│  │  ├─ 3c
│  │  │  ├─ 1d47ccb9906c3b8a182e6d0574fc0970836c9d
│  │  │  ├─ 3d8af5838ec00fe5a5ce3a306bf84b46a3a3ed
│  │  │  └─ ae8e1d9284182e3858897320e96cc03a473693
│  │  ├─ 3d
│  │  │  ├─ 4b175d187c111a53bb13800d5096dc7e664b4a
│  │  │  └─ 83e11f464d22e0179e7c2a4c653bb390eae19d
│  │  ├─ 3e
│  │  │  └─ e1d7be2b8507c282423faff9db354ae3e92eee
│  │  ├─ 3f
│  │  │  ├─ 57f85019dce7adb182d752f8b38d8f777721dc
│  │  │  └─ ef3bacca748c6287a729e82b816687dc755981
│  │  ├─ 41
│  │  │  ├─ 0b6b8704ee0ee4664a5b428441eda3ec38f63a
│  │  │  ├─ 25692e85733dda66b05bb1b5305dc599e6bde3
│  │  │  ├─ 3bafea57c593db090b072a5a0c2d61e49c7e57
│  │  │  └─ df785201eb2338bc01c716ba7f6c237b0a4cfd
│  │  ├─ 42
│  │  │  ├─ 2f3f3852fdac71c625951d2eb40fcdb511784d
│  │  │  └─ 7d659f1fd46d3b3a515f3e13d2d70e7b8c1bf7
│  │  ├─ 46
│  │  │  ├─ 1a72c0a3e9c1904a2a0fc84bd395343a6cd1d7
│  │  │  └─ 1cdbafc1768ddf10df1e72515ab260fa55909f
│  │  ├─ 48
│  │  │  ├─ 3c14f2be9c19bcad0371b4af3821650f81baa1
│  │  │  ├─ 7a91feee5a902a6623dda2e1b41e27010e01f7
│  │  │  └─ 9df2951df45be5c4a6852cd07d1dd2f8749d4c
│  │  ├─ 4a
│  │  │  └─ 89d5e83f5921111e8fb548df7c762738370548
│  │  ├─ 4c
│  │  │  ├─ 30c21668bf7e9b00f18954d0a17f65f87bbdd6
│  │  │  ├─ 5abdd443e02267105e169cdb2f48dd681fa8ed
│  │  │  └─ e39ebaa1e953dc1acd1b2ce9ecb01f4aaace96
│  │  ├─ 4e
│  │  │  └─ 56f0643f089dbdbb0f33d4204447eebbec2c2c
│  │  ├─ 51
│  │  │  └─ a6dec71b0a2bef7efe1d3e8e438a90cd6e0f08
│  │  ├─ 52
│  │  │  ├─ 2f48d9b18b8efce0be471fc77d222d3af40f69
│  │  │  └─ e59b625dd9caf26e38b942fe23dd61e1c83a75
│  │  ├─ 53
│  │  │  └─ 7d9acd70e4b610cb49581c3cbb1441ee315d41
│  │  ├─ 54
│  │  │  ├─ 202545970c44c97033d7a933460bfe235a45d7
│  │  │  ├─ 4526d0756a51e496c15d815ac51ce7ad94ce84
│  │  │  └─ bae8d7681667532f233ae705da1f26f4fb0776
│  │  ├─ 55
│  │  │  └─ a3adc82df8730e4cbbf00e04dd508a6c67f789
│  │  ├─ 56
│  │  │  └─ 5048e123b1ebc2f40688074bee51d18d0ebedf
│  │  ├─ 57
│  │  │  ├─ b6ec15f9e8c5882cdd504a910314e0ded30d84
│  │  │  └─ fccfc83085e1e4e2b77a13455f28f79d01f11f
│  │  ├─ 58
│  │  │  └─ 13888a4b9ffb78223c81af2bab444f6f446358
│  │  ├─ 59
│  │  │  ├─ 6a72f8e19eeb3ab0d6a2f1db5c419333881795
│  │  │  └─ ddc5e31ef776a2b468f66cebd57b7e85e7ac6d
│  │  ├─ 5a
│  │  │  └─ 4ba17c27b11925d5578b7d50f2555929556518
│  │  ├─ 5c
│  │  │  └─ 51eaa4e197da23f9900d3f0f2f57e5cd204f08
│  │  ├─ 5d
│  │  │  └─ 5fe5df09a2e39fa00fe7757340dbb40d121371
│  │  ├─ 5e
│  │  │  └─ 69c2641d878c112659eb5037640fcf89a07c94
│  │  ├─ 60
│  │  │  ├─ 76604c44ce8bb0ce9c159f22528fb1dec0b778
│  │  │  └─ c834bea551193f628a31a7ca5aa1e16b043b03
│  │  ├─ 61
│  │  │  ├─ d41505c74849aa0e1d03f2b13ff387c5900f16
│  │  │  └─ f27777403e3568e32db49a04f64371bed1a023
│  │  ├─ 63
│  │  │  ├─ 7bdad7550f88e98addfd5d91210f6b16d54d84
│  │  │  ├─ e97929b7038de57456062149e0ae3dfd82d699
│  │  │  └─ eb0e05026f83fd03e7ba6258c345b002ed6ba6
│  │  ├─ 64
│  │  │  └─ 783f906baaca8b3b5acd1bce180c6359f5d15e
│  │  ├─ 67
│  │  │  └─ f274093ebcfb3167bc3df86f604b7f81105a23
│  │  ├─ 68
│  │  │  ├─ 19020a95e3895b55f5572bae49ecdaf8aaeed0
│  │  │  └─ baf83c5e8983965f58d9a29c992d278d88e66d
│  │  ├─ 69
│  │  │  ├─ 6fd16a5bc9a99abe33d7056beb8cd77590e5e2
│  │  │  └─ b99ba9c8c5205940c4946d21483954fe45f48a
│  │  ├─ 6a
│  │  │  ├─ 4903bb2abcf11b1bf0c2828af18d784910b3ff
│  │  │  ├─ a5195667646c423efa4550e94cd6806aec4c73
│  │  │  └─ fddacb2dea2095ccc4876b9b6f3882d38145ec
│  │  ├─ 6b
│  │  │  └─ be94cc1f353e15c5f86737984a6d7ef4006d0f
│  │  ├─ 6c
│  │  │  ├─ 3ad70e1f49e275840c1c858b8bb4fdeac917f2
│  │  │  ├─ 7d607f4da053bf818c0076be20140528d91297
│  │  │  └─ ece63d931daecab66e0745a9d2626c39195c1d
│  │  ├─ 6d
│  │  │  ├─ 139f81b444f3aa7da624a354e37d1234b69942
│  │  │  └─ 5e6506cd1cf1963e894fbba4a75aef35564d06
│  │  ├─ 6f
│  │  │  ├─ 3b9b6fa8da13052c39214f5106e75f7abf714c
│  │  │  ├─ 8c3d2672dccce46f2793dc2007bc4af6eb63c5
│  │  │  └─ b747321c0af3dfdb8eddea3e3e1c701afa47f4
│  │  ├─ 72
│  │  │  ├─ 0f401a8e69536d811a8055f56fc621542fc1c7
│  │  │  ├─ 848f68661c349b01cbfc6dbb1ea82c7be9a85f
│  │  │  └─ eb77c5542ab42a69e20c42f8c4de0944977969
│  │  ├─ 73
│  │  │  └─ 489779e4033cd6794a233ab789335170ef1e62
│  │  ├─ 75
│  │  │  └─ 7e34fbcf60adafac0caedf155f501bf18f8fe3
│  │  ├─ 77
│  │  │  ├─ 49cc1d8758ec9eec70cbcb5c02fb87a4d45045
│  │  │  └─ 5d5cdd48f3fb4eeb970c1a75b5bbc82a2db793
│  │  ├─ 78
│  │  │  ├─ bc6b6a9823daf8f58ccd9cb7348c74a6e09c9f
│  │  │  └─ d2137f1c53d337842b0eea6e9a0fed2fc61b93
│  │  ├─ 79
│  │  │  └─ b7326ecef9722629e997f6caaea8731f1ee774
│  │  ├─ 7e
│  │  │  ├─ 5171acfdc75c46be0584346694d92643a52272
│  │  │  ├─ 559f77bf7269eeadc4250f96dae620d139852e
│  │  │  ├─ 8e421279e27e4317ea6436c067a2b2ace09280
│  │  │  └─ cf05a5f29fc744a27f9bf9a37beb20ab441b7b
│  │  ├─ 7f
│  │  │  ├─ 3462ba1b1a45df25af4940394c2742785b617b
│  │  │  └─ aac83fd1bd9348421562198fb5d7fc0dcabea6
│  │  ├─ 80
│  │  │  ├─ 7488aad1651c0b00442d496171f61615d13e56
│  │  │  └─ d975bb955e31bc8b34e3f367d7b2ed14abfec0
│  │  ├─ 81
│  │  │  └─ 12b4baed310d52e72636d259442dec0311f063
│  │  ├─ 82
│  │  │  └─ c64869d1a29ed9772d4a5caff1216aa4847be9
│  │  ├─ 84
│  │  │  └─ ddb7c4e057cb5385fdce4e80cf5514288bede9
│  │  ├─ 86
│  │  │  └─ a72d053e8f51383f7414c61617182f7ebc1637
│  │  ├─ 88
│  │  │  └─ 4a7c98ae1c9415c77b6cb3c9047e5aab8d8107
│  │  ├─ 89
│  │  │  ├─ 50f1479eff725a6ffb3107671f5e759f4dfdee
│  │  │  └─ a63caad9222cd3f452a9f82444457f22fcf9ee
│  │  ├─ 8a
│  │  │  └─ a249b8efac9c65ca860fe3f7a782f435b203b2
│  │  ├─ 8b
│  │  │  └─ 34f50b0dd3920a63a56492ddc691eeb8ee714a
│  │  ├─ 8e
│  │  │  └─ 8ce75516caaa3646f87ae2ff589e7f7a5b6852
│  │  ├─ 91
│  │  │  ├─ 7494a33df52645c8192def2322a26afe20c6cb
│  │  │  └─ d2ca79a6632c64955b3f27547b2b635459da46
│  │  ├─ 92
│  │  │  ├─ 50ae66ced261928a773bb84ebc88dfbccf4e71
│  │  │  ├─ bdec0361b14e7bbf1d296e71d12c7b896b8b00
│  │  │  └─ fdbe0e43b77714b020108cdd037b60638efcbd
│  │  ├─ 93
│  │  │  ├─ 141356f25d24b2dffef7f841307ae6dafa39ad
│  │  │  ├─ 54f863344e269c8e8d5a380289d454bd16b82a
│  │  │  └─ ccf137faa23491cef1b069e81529ef7a698fde
│  │  ├─ 94
│  │  │  ├─ 3be79e7f502076c1e819037f89b4f5cd2779cf
│  │  │  └─ 9c9e8edfca9754bb0250188b3de9ecb0d197e7
│  │  ├─ 95
│  │  │  └─ 30dd9cb63d043f5f13d89fe41fb155fbe4d7a6
│  │  ├─ 96
│  │  │  ├─ 2f4acc59fab8254b9f81f04c476808166cd315
│  │  │  └─ 56a5faac158a6a52b6c87195c61f7043de39e2
│  │  ├─ 97
│  │  │  ├─ 0781f657647c94cad36fc5d052abe1f742513a
│  │  │  └─ c591e6900205e6b73928be764861e81ea7c793
│  │  ├─ 98
│  │  │  └─ 0913a8d7c602575d539d9c11120526af4768a8
│  │  ├─ 9a
│  │  │  └─ c670848984582fb894fe79ddba54872897ba7a
│  │  ├─ 9b
│  │  │  ├─ 0cfa9e32e266b43d8bd9d0115740e62338cd4f
│  │  │  ├─ d4f8425fea16693aa5fb0971da98c1ebfc8318
│  │  │  └─ ea56c89fda4a10a38436feca0d4743e22a37f9
│  │  ├─ 9d
│  │  │  ├─ 6d0899c70b0a9655d373c6f94a898653033da3
│  │  │  ├─ 90d7687b11a69688753c5060753df21cac3983
│  │  │  └─ c93c2f0abbacf11412af078f3223bc303c073d
│  │  ├─ 9f
│  │  │  ├─ 0b11b6f55aab9fccb267a72a0836d9df920608
│  │  │  ├─ 20dea11d8ae2ad3d62cde703628bc96214dac7
│  │  │  ├─ 37cebb8be2b742b0eaee309e4d03114e633487
│  │  │  └─ 3ad416e5ad351e16d0bc02b6b8e38792170233
│  │  ├─ a0
│  │  │  ├─ 38a3a07f3302fe4fb8de9a66cca9e3a3a0d804
│  │  │  └─ 5039b548ab5621243216b2e3d46387c308a34f
│  │  ├─ a2
│  │  │  └─ b913c8b569ab20310c1872607c3284d3c5bbc2
│  │  ├─ a3
│  │  │  ├─ 24af5be9d3536513fdad7251783fc08488c866
│  │  │  └─ feefe299d68a3e1cb096679152fd004f048a1e
│  │  ├─ a5
│  │  │  └─ e6af8db7e8c088e45a0ad14c10696037249b49
│  │  ├─ a7
│  │  │  ├─ 0b3955717478a513147240bd4546df0daea6c8
│  │  │  └─ ef6fa5a4643e808ab7ec2cff92bb4e323f461b
│  │  ├─ a8
│  │  │  ├─ 2cf3ec1947ef3c09736e764dd331a69bd0df22
│  │  │  └─ 8dac2f00f96e2b718947db142177011493d451
│  │  ├─ a9
│  │  │  ├─ 4b57b34ce19b77a82181eccd7f4d5eece4b32b
│  │  │  └─ 69f2b23eae92658f031edb90ee9f5a038dc24f
│  │  ├─ aa
│  │  │  ├─ 0d1ceaa4213baf1181bd775c88d0f7e88e7ad8
│  │  │  └─ d128350cc7073e73cc2c24607f03998c9ebb8d
│  │  ├─ ab
│  │  │  └─ e35315f20a11edddcfbfe3e800e8e3bfdc78d3
│  │  ├─ ad
│  │  │  └─ 298f818a2bb534cf11bea3b2f88d4d4da4edab
│  │  ├─ ae
│  │  │  └─ d639659263888c23854139551c1a7e63cf44b9
│  │  ├─ af
│  │  │  ├─ afcf44d85747c3bd0157d454a57abe62353ff1
│  │  │  └─ dcd7579f2df9c7705add18597d41bc396b8c21
│  │  ├─ b0
│  │  │  └─ 0b089a8908f03d5b811c3ee2940f5f153962a4
│  │  ├─ b1
│  │  │  └─ e8f72796d4b1ea0defc3f6e1c4f042be43f3f5
│  │  ├─ b2
│  │  │  ├─ 24f310a72e4e8c9e9206d9464af0abf71be715
│  │  │  ├─ b672c1f6d733bb76fcfb9c65071ac7ca9891b8
│  │  │  ├─ cdc96a62b2489efbe746857656c68bb4f73de3
│  │  │  └─ da0f811afedc0bea230f60f3800f21f31c1a54
│  │  ├─ b3
│  │  │  ├─ b74670ec5120ca260805d8e37803827c653a20
│  │  │  └─ e41f9690aaf54a70e47eb7b3213a1e1a81df8c
│  │  ├─ b4
│  │  │  ├─ 77940000189aefdd34caf61b918335ce642875
│  │  │  └─ 7af4d8402b6906cfcaf02e9aa335f7ee026079
│  │  ├─ b7
│  │  │  ├─ 31f57f7ab7d3fe8bfc34ef3ae2020dbe39cff9
│  │  │  ├─ 36a080156188abf86132cd344fba4739d41dbc
│  │  │  └─ 4062fa61dbd4742f3d93616929df9f5378b6b2
│  │  ├─ b8
│  │  │  └─ 04ecbb9394027fcb1a9fb91f3357c0ce9c141d
│  │  ├─ b9
│  │  │  └─ 049a6fd37f12e413df9a58ce0fd1be1f07ca21
│  │  ├─ bb
│  │  │  ├─ 0264508d3664b076ddfc81a5bf8571cc31322d
│  │  │  └─ 47cf6a690ff0b8a1f406719d8d357742dc14e3
│  │  ├─ bc
│  │  │  ├─ 3199e7728de7e4b9ba688eaddb493d64a74ab8
│  │  │  └─ 3f31727a800544fe2af49bc80dd564ae906049
│  │  ├─ bd
│  │  │  └─ 61ee2ce1a5d29e187a1e803ef19cc208724d3c
│  │  ├─ be
│  │  │  ├─ 7fb7cd0e9db9d29e4a6b375c321ff97e69aebb
│  │  │  └─ e79669373b7958112b38eac10c6475ee2564e0
│  │  ├─ bf
│  │  │  └─ 3a7227197af535e132119ea351e4a6bdd418bd
│  │  ├─ c2
│  │  │  └─ 1856f3ac853f61f84c08634e95cd4d77161bfa
│  │  ├─ c3
│  │  │  └─ 278512512f25b99360c9b239aba0a5e070766f
│  │  ├─ c4
│  │  │  └─ 13b83837f6439cec309017f2e1dc05e89b16af
│  │  ├─ c6
│  │  │  └─ 71d427d79d5ba16f56cd0a1ea131dbb3dc6eca
│  │  ├─ c7
│  │  │  └─ 69893f4f4f1c426d60df96063980637b78e6e1
│  │  ├─ c8
│  │  │  ├─ 0968c0dc2626d6a23fa3fc16c865264ecda27a
│  │  │  └─ 77ef121f494e7634722ec3bf8e97a03fd4b559
│  │  ├─ c9
│  │  │  └─ 1921c3fbeffcaaf4e212208537fbdfa60d5278
│  │  ├─ ca
│  │  │  └─ 79e326035641f5a4f8819c07c6310c2469eafc
│  │  ├─ cb
│  │  │  ├─ 2d2d1c54f13b3a795591ebc25ae7c7ef40a328
│  │  │  └─ 78c3bf036631b36178ac51e643f316e79d5848
│  │  ├─ cc
│  │  │  └─ 6a75432ca505a9abe8c4910ac6f66e6b28a66c
│  │  ├─ cd
│  │  │  └─ 898ae13d9e3a341b3506b39fab47441107518c
│  │  ├─ ce
│  │  │  └─ 1b043990580648b17cf6d6ba391621fa78be99
│  │  ├─ d1
│  │  │  └─ 9e82f100bcf736aab9361a5ebb1cce554bb1b4
│  │  ├─ d2
│  │  │  └─ 37d8d76c8f3ffd8c5538cdd07ab7276b8dc03a
│  │  ├─ d4
│  │  │  └─ c10ddb4d406eccc192c80b099b89d7488e00a9
│  │  ├─ d6
│  │  │  └─ 84870317363491947349ec8f7260ee62305a10
│  │  ├─ d7
│  │  │  ├─ 8cf9c86f79370e9115e05c450c677a4d495fe6
│  │  │  └─ bf766372c82bcde0905a62ee25d73b5a946ed4
│  │  ├─ d8
│  │  │  ├─ 626159aa80f61133cc3cc644c9b4bceb4e57ec
│  │  │  ├─ 9929d752064c6cf4e4911cf7255558466b3bd1
│  │  │  └─ c7c73fbc0d460a8e0155afb725348b2c71f0c7
│  │  ├─ d9
│  │  │  ├─ 4e4acac1b3ea2b2378bd402b4311c5afe65457
│  │  │  └─ 8701b7c58c29f8994bb3ef66d3ae9c265b35ca
│  │  ├─ da
│  │  │  ├─ 269a1cf8a4591a36657dc9748bb0705dca3112
│  │  │  └─ db5eb63e5fb1cf8366aafdab1e2bc7e4e38659
│  │  ├─ db
│  │  │  └─ e0b25f5d1e240ffd573b281a298430e560090b
│  │  ├─ dd
│  │  │  └─ c5139b37b80221836a2983a1ccc86ce81f7785
│  │  ├─ df
│  │  │  ├─ dbd3e709b2aa1941ac7d99dcd1cd6f04374d90
│  │  │  └─ ea328be8292935b67fdd000e3c9e23e99e17be
│  │  ├─ e1
│  │  │  └─ cf427569d3ea916f3130c23d2c9a9bf0f9ebb0
│  │  ├─ e3
│  │  │  └─ de03f8ceed4a6a6a9e1131f77dfc0be202d314
│  │  ├─ e4
│  │  │  └─ 574167a921bb68081dec8092ac6c68ba1f7e72
│  │  ├─ e5
│  │  │  ├─ d8d6c385447cd6ed82ead8d2642737f07cb0dc
│  │  │  └─ e4ded761723925ac5b6c6931fd8d0e3f32ab7b
│  │  ├─ e6
│  │  │  ├─ 4d1428fd0b226a273149ba5a0af99101e95cea
│  │  │  └─ d24a2ab938ec0646f988a6140413c62f40d03e
│  │  ├─ e8
│  │  │  ├─ 6f2871e385b4ea62887f108c1405363bcb70a7
│  │  │  └─ a5867b696d20deac98b1f7fbe836ff888486aa
│  │  ├─ e9
│  │  │  ├─ 7522baa9f6a20ffa70311d404c146a67a1f4c7
│  │  │  └─ b8761d5304c304dec5357058a3a127d74df9e5
│  │  ├─ ea
│  │  │  └─ 90577fac07de47d2b032e8213764f6a08e1d9a
│  │  ├─ eb
│  │  │  └─ f3af1e12101148e29b0911942f83dac0f17f91
│  │  ├─ ed
│  │  │  ├─ 3bbe54d8595336925050c4c08d4e1730490dbf
│  │  │  └─ 4aa8e6715329cf06f4c519e4cef2f608c7f822
│  │  ├─ ee
│  │  │  └─ e5d4cba68d197382ddcc8aa61ad2cedcaf22e0
│  │  ├─ ef
│  │  │  ├─ 3db402ea287fb1291c6c7b75973cde2dcbe05e
│  │  │  ├─ 6dc62534bd4f5bbb81a30bf81bd2bc89b243a3
│  │  │  └─ b41c672df02a3e68d156a135a844b55c97be3f
│  │  ├─ f0
│  │  │  └─ cf1dd5001dca8d210ed7b5de397dca06f6a1f8
│  │  ├─ f2
│  │  │  └─ d62588737561db8f9ccf1bc96c7f4c284f5156
│  │  ├─ f3
│  │  │  ├─ b6a5cc4d9dddce2a95e0771fdba1a75aca6c0a
│  │  │  ├─ df6262be2d0f6931b56c8581598355aa24db30
│  │  │  └─ f6a7ede26d9d665b76e1143da8e9830390e8e9
│  │  ├─ f5
│  │  │  └─ ab9f575b25251666fac5e9a1be9f9d6e426f7c
│  │  ├─ f7
│  │  │  └─ 1a0d76a5bf72f2b022a8dcd6a8c8ab174632f6
│  │  ├─ fb
│  │  │  └─ f330efb390f10366b6aec0b9c06630f39e68db
│  │  ├─ fc
│  │  │  ├─ 4b123816a7b02645603db83b759dd8fac9844d
│  │  │  └─ be9f6ae920b062b3fbe354a876249ab54cf876
│  │  ├─ fe
│  │  │  ├─ b0a6dea64772249d10f74981a4099f8d1424e4
│  │  │  └─ f6a560af3e44c45cd2015a367ff61caf0c740c
│  │  ├─ info
│  │  └─ pack
│  │     ├─ pack-a34e718be3c938fbd45efdc6b77890a0477ab451.idx
│  │     ├─ pack-a34e718be3c938fbd45efdc6b77890a0477ab451.pack
│  │     └─ pack-a34e718be3c938fbd45efdc6b77890a0477ab451.rev
│  ├─ ORIG_HEAD
│  ├─ packed-refs
│  └─ refs
│     ├─ heads
│     │  ├─ dev
│     │  ├─ feature
│     │  │  ├─ UES-20
│     │  │  ├─ UES-21
│     │  │  ├─ UES-22
│     │  │  ├─ UES-25
│     │  │  ├─ UES-26
│     │  │  ├─ UES-27
│     │  │  ├─ UES-28
│     │  │  ├─ UES-29
│     │  │  ├─ UES-30
│     │  │  ├─ UES-6
│     │  │  └─ UES-7
│     │  └─ main
│     ├─ remotes
│     │  └─ origin
│     │     ├─ dev
│     │     ├─ feature
│     │     │  ├─ UES-20
│     │     │  ├─ UES-21
│     │     │  ├─ UES-22
│     │     │  ├─ UES-25
│     │     │  ├─ UES-26
│     │     │  ├─ UES-27
│     │     │  ├─ UES-28
│     │     │  ├─ UES-29
│     │     │  ├─ UES-30
│     │     │  ├─ UES-40
│     │     │  └─ UES-7
│     │     └─ HEAD
│     └─ tags
├─ .gitignore
├─ app.js
├─ bcrypt_test.js
├─ controllers
│  ├─ adminController.js
│  ├─ categoryController.js
│  ├─ companiesController.js
│  ├─ contractsController.js
│  ├─ dashboardController.js
│  ├─ employeesController.js
│  ├─ formController.js
│  ├─ InquiriesController.js
│  ├─ loginController.js
│  ├─ newsController.js
│  ├─ oldCompaniesController.js
│  ├─ oldContractsController.js
│  ├─ oldStatementsController.js
│  ├─ rateController.js
│  ├─ scaleController.js
│  └─ statementsController.js
├─ cronJobs.js
├─ db
│  ├─ config.js
│  └─ db.js
├─ models
│  ├─ adminInfoModel.js
│  ├─ categoryModel.js
│  ├─ companiesModel.js
│  ├─ contractsModel.js
│  ├─ dashboardModel.js
│  ├─ employeesModel.js
│  ├─ formModel.js
│  ├─ inquiriesModel.js
│  ├─ loginModel.js
│  ├─ newsModel.js
│  ├─ oldCompaniesModel.js
│  ├─ oldContractsModel.js
│  ├─ oldStatementsModel.js
│  ├─ rateModel.js
│  ├─ scaleModel.js
│  └─ statementsModel.js
├─ multerconfig.js
├─ package-lock.json
├─ package.json
├─ pnpm-lock.yaml
├─ README.md
├─ routes
│  ├─ adminRoute.js
│  ├─ categoryRoute.js
│  ├─ companiesRoute.js
│  ├─ contractsRoute.js
│  ├─ dashboardRoute.js
│  ├─ employeesRoute.js
│  ├─ formRoute.js
│  ├─ inquiriesRoute.js
│  ├─ loginRoute.js
│  ├─ newsRoute.js
│  ├─ oldCompaniesRoute.js
│  ├─ oldContratsRoute.js
│  ├─ oldStatementsRoute.js
│  ├─ ratesRoute.js
│  ├─ scaleRoute.js
│  └─ statementsRoute.js
├─ uploads
│  ├─ 5cb5c1f61111a.jpeg
│  ├─ 5cb5c1f61111b.jpeg
│  ├─ 5cb5c1f61111c.jpeg
│  ├─ 5cb5c1f61111d.jpeg
│  ├─ 5cb5c1f61111e.jpeg
│  ├─ 5cb5c1f62222a.jpeg
│  ├─ 5cb5c1f62222b.jpeg
│  ├─ 5cb5c1f62222c.jpeg
│  ├─ 5cb5c1f62222d.jpeg
│  ├─ 5cb5c1f63333a.jpeg
│  ├─ 5cb5c1f63333b.jpeg
│  ├─ 5cb5c1f63333c.jpeg
│  ├─ 5cb5c1f63333d.jpeg
│  ├─ 5cb5c1f64444a.jpeg
│  ├─ 5cb5c1f64444b.jpeg
│  ├─ 5cb5c1f64444c.jpeg
│  ├─ 5cb5c1f64444d.jpeg
│  ├─ 5cb5c1f65555a.jpeg
│  ├─ 5cb5c1f65555b.jpeg
│  ├─ 5cb5c1f65555c.jpeg
│  ├─ 5cb5c1f65555d.jpeg
│  ├─ 5cb5c1f66666a.jpeg
│  ├─ 5cb5c1f66666b.jpeg
│  ├─ 5cb5c1f66666c.jpeg
│  ├─ 5cb5c1f66666d.jpeg
│  ├─ 5cb5c1f67777a.jpeg
│  ├─ 5cb5c1f67777b.jpeg
│  ├─ 5cb5c1f67777c.jpeg
│  ├─ 5cb5c1f67777d.jpeg
│  ├─ 5cb5c1f68888a.jpeg
│  ├─ 5cb5c1f68888b.jpeg
│  ├─ 5cb5c1f68888c.jpeg
│  ├─ 5cb5c1f69999a.jpeg
│  ├─ 5cb5c1f69999b.jpeg
│  ├─ 5cb5c1f69999c.jpeg
│  ├─ 61ce428d160c5.jpeg
│  ├─ 61d45b9c84017.png
│  ├─ 61dc4eb032783.jpg
│  ├─ 61f14d121e2d5.jpg
│  ├─ 61f14d5849ce2.jpg
│  ├─ 61faa721863ff.png
│  ├─ 620c16b71560e.jpg
│  ├─ 6210100ab383d.jpg
│  ├─ 6210109277054.jpg
│  ├─ 621010c613ab0.jpg
│  ├─ 621a371c0d179.jpg
│  ├─ 621a371c0f8cf.jpg
│  ├─ 6226219e3fe31.png
│  ├─ 6227fac62001d.jpg
│  ├─ 62289e9035c1d.jpg
│  ├─ 622b781f45c6f.jpeg
│  ├─ 62325d8c2f2d2.jpg
│  ├─ 62432409759db.pdf
│  ├─ 62432d23c7cfc.pdf
│  ├─ 62432d784d049.pdf
│  ├─ 62432effa4f57.pdf
│  ├─ 62432f984baed.pdf
│  ├─ 624331779642f.pdf
│  ├─ 624331bf7ffd7.pdf
│  ├─ 624332337a103.pdf
│  ├─ 624edeff5fc50.jpg
│  ├─ 624edeff94ab4.jpg
│  ├─ 624edeff99020.jpg
│  ├─ 624f7fbb68d4d.png
│  ├─ 62596985bdd2f.jpg
│  ├─ 626b36c08a1ba.jpg
│  ├─ 626e046799835.jpg
│  ├─ 62703e6165edd.png
│  ├─ 628f90ebe843a.docx
│  ├─ 628f915b5c9ec.pdf
│  ├─ 62a7377434c0a.jpg
│  ├─ 62a737744bd78.jpg
│  ├─ 62a7377453945.jpg
│  ├─ 62b5e0b25b0e3.png
│  ├─ 62c2e4815bd95.png
│  ├─ 62c57c29f1b82.jpeg
│  ├─ 62c98bbbaa08c.jpg
│  ├─ 62d06d1a0ac63.png
│  ├─ 62dc31b839f54.png
│  ├─ 62e440678cdbd.jpg
│  ├─ 630775ee30431.jpg
│  ├─ 630775ee33f3f.jpg
│  ├─ 630e756dd82b4.jpg
│  ├─ 6310cf5571b51.jpg
│  ├─ 63121afa411c3.jpg
│  ├─ 631f5037aefc7.jpg
│  ├─ 63247ba95aebc.png
│  ├─ 632dcab05aa88.png
│  ├─ 6330d73cad882.jpg
│  ├─ 6357ff2ebc3e6.jpg
│  ├─ 635bc75f9ecd1.jpg
│  ├─ 6363c0b4c3b67.pdf
│  ├─ 638e680b4a10c.jpg
│  ├─ 63a31c747d071.jpg
│  ├─ 63a5c64032438.jpg
│  ├─ 63aae81999481.jpg
│  ├─ 63ac432c5405d.jpg
│  ├─ 63ac432c55c02.jpg
│  ├─ 63aeddb3d112d.jpg
│  ├─ 63aeddb3dc63f.jpg
│  ├─ 63aeddb3df692.jpg
│  ├─ 63aeddb3e7185.jpg
│  ├─ 63af00f9ec905.pdf
│  ├─ 63af01363873d.pdf
│  ├─ 63b8255edfb7b.pdf
│  ├─ 63c7f8ab4c6af.png
│  ├─ 63e39f088a659.png
│  ├─ 63f8de3a262ef.jpg
│  ├─ 63fe0da24251e.pdf
│  ├─ 642614ddb4c98.pdf
│  ├─ 642615f66021c.png
│  ├─ 644f9ea5c4bd1.png
│  ├─ 645c30b1836c2.jpg
│  ├─ 6495bb11d348d.jpg
│  ├─ 64a58948ece06.jpeg
│  ├─ 64a85d467fb50.jpg
│  ├─ 64a85d4684dad.jpg
│  ├─ 64a85d84d697a.jpg
│  ├─ 64ac2e9a72a66.pdf
│  ├─ 64c846b6747b5.png
│  ├─ 64c846d517c67.png
│  ├─ 64c847149dd5b.pdf
│  ├─ 64fb9d0e22eb4.jpg
│  ├─ 650850a7338ae.png
│  ├─ 652fdfc52a23c.png
│  ├─ 653679841e9ce.jpg
│  ├─ 653950629f9fc.png
│  ├─ 65395062a4f82.png
│  ├─ 654900efc7e28.pdf
│  ├─ 6549011813224.pdf
│  ├─ 656f4628ebb11.png
│  ├─ 65956166b0229.png
│  ├─ 6596ad9c02065.png
│  ├─ 659d4ce4747df.png
│  ├─ 65b11e232684a.pdf
│  ├─ 65b11e6254818.pdf
│  ├─ 65b1207758bf6.jpg
│  ├─ 65e0c7a369254.jpeg
│  ├─ 66022125afeac.pdf
│  ├─ 66022251c75af.jpg
│  ├─ 66022251cd981.jpg
│  ├─ 660ffd1db7e48.png
│  ├─ 66229b47f0d9c.png
│  ├─ 66229cf39da81.pdf
│  ├─ 663b79a023355.jpg
│  ├─ 664fd32e9b596.png
│  ├─ 667f4b556cd6b.jpeg
│  ├─ 6682b4a77a9f1.pdf
│  ├─ 668409fc5b126.pdf
│  ├─ archivos-noticia
│  │  ├─ 62432409759db.pdf
│  │  ├─ 62432d23c7cfc.pdf
│  │  ├─ 62432d784d049.pdf
│  │  ├─ 62432effa4f57.pdf
│  │  ├─ 62432f984baed.pdf
│  │  ├─ 624331779642f.pdf
│  │  ├─ 624331bf7ffd7.pdf
│  │  ├─ 624332337a103.pdf
│  │  ├─ 628f90ebe843a.docx
│  │  ├─ 628f915b5c9ec.pdf
│  │  ├─ 6363c0b4c3b67.pdf
│  │  ├─ 63af00f9ec905.pdf
│  │  ├─ 63af01363873d.pdf
│  │  ├─ 63b8255edfb7b.pdf
│  │  ├─ 63fe0da24251e.pdf
│  │  ├─ 642614ddb4c98.pdf
│  │  ├─ 64ac2e9a72a66.pdf
│  │  ├─ 64c847149dd5b.pdf
│  │  ├─ 654900efc7e28.pdf
│  │  ├─ 6549011813224.pdf
│  │  ├─ 65b11e232684a.pdf
│  │  ├─ 65b11e6254818.pdf
│  │  ├─ 66022125afeac.pdf
│  │  ├─ 66229cf39da81.pdf
│  │  ├─ 668409fc5b126.pdf
│  │  └─ urls.txt
│  ├─ imagenes-noticia
│  │  ├─ 5cb5c1f61111a.jpeg
│  │  ├─ 5cb5c1f61111b.jpeg
│  │  ├─ 5cb5c1f61111c.jpeg
│  │  ├─ 5cb5c1f61111d.jpeg
│  │  ├─ 5cb5c1f61111e.jpeg
│  │  ├─ 5cb5c1f62222a.jpeg
│  │  ├─ 5cb5c1f62222b.jpeg
│  │  ├─ 5cb5c1f62222c.jpeg
│  │  ├─ 5cb5c1f62222d.jpeg
│  │  ├─ 5cb5c1f63333a.jpeg
│  │  ├─ 5cb5c1f63333b.jpeg
│  │  ├─ 5cb5c1f63333c.jpeg
│  │  ├─ 5cb5c1f63333d.jpeg
│  │  ├─ 5cb5c1f64444a.jpeg
│  │  ├─ 5cb5c1f64444b.jpeg
│  │  ├─ 5cb5c1f64444c.jpeg
│  │  ├─ 5cb5c1f64444d.jpeg
│  │  ├─ 5cb5c1f65555a.jpeg
│  │  ├─ 5cb5c1f65555b.jpeg
│  │  ├─ 5cb5c1f65555c.jpeg
│  │  ├─ 5cb5c1f65555d.jpeg
│  │  ├─ 5cb5c1f66666a.jpeg
│  │  ├─ 5cb5c1f66666b.jpeg
│  │  ├─ 5cb5c1f66666c.jpeg
│  │  ├─ 5cb5c1f66666d.jpeg
│  │  ├─ 5cb5c1f67777a.jpeg
│  │  ├─ 5cb5c1f67777b.jpeg
│  │  ├─ 5cb5c1f67777c.jpeg
│  │  ├─ 5cb5c1f67777d.jpeg
│  │  ├─ 5cb5c1f68888a.jpeg
│  │  ├─ 5cb5c1f68888b.jpeg
│  │  ├─ 5cb5c1f68888c.jpeg
│  │  ├─ 5cb5c1f69999a.jpeg
│  │  ├─ 5cb5c1f69999b.jpeg
│  │  ├─ 5cb5c1f69999c.jpeg
│  │  ├─ 61ce428d160c5.jpeg
│  │  ├─ 61d45b9c84017.png
│  │  ├─ 61dc4eb032783.jpg
│  │  ├─ 61f14d121e2d5.jpg
│  │  ├─ 61f14d5849ce2.jpg
│  │  ├─ 61faa721863ff.png
│  │  ├─ 620c16b71560e.jpg
│  │  ├─ 6210100ab383d.jpg
│  │  ├─ 6210109277054.jpg
│  │  ├─ 621010c613ab0.jpg
│  │  ├─ 621a371c0d179.jpg
│  │  ├─ 621a371c0f8cf.jpg
│  │  ├─ 6226219e3fe31.png
│  │  ├─ 6227fac62001d.jpg
│  │  ├─ 62289e9035c1d.jpg
│  │  ├─ 622b781f45c6f.jpeg
│  │  ├─ 62325d8c2f2d2.jpg
│  │  ├─ 624edeff5fc50.jpg
│  │  ├─ 624edeff94ab4.jpg
│  │  ├─ 624edeff99020.jpg
│  │  ├─ 624f7fbb68d4d.png
│  │  ├─ 62596985bdd2f.jpg
│  │  ├─ 626b36c08a1ba.jpg
│  │  ├─ 626e046799835.jpg
│  │  ├─ 62703e6165edd.png
│  │  ├─ 62a7377434c0a.jpg
│  │  ├─ 62a737744bd78.jpg
│  │  ├─ 62a7377453945.jpg
│  │  ├─ 62b5e0b25b0e3.png
│  │  ├─ 62c2e4815bd95.png
│  │  ├─ 62c57c29f1b82.jpeg
│  │  ├─ 62c98bbbaa08c.jpg
│  │  ├─ 62d06d1a0ac63.png
│  │  ├─ 62dc31b839f54.png
│  │  ├─ 62e440678cdbd.jpg
│  │  ├─ 630775ee30431.jpg
│  │  ├─ 630775ee33f3f.jpg
│  │  ├─ 630e756dd82b4.jpg
│  │  ├─ 6310cf5571b51.jpg
│  │  ├─ 63121afa411c3.jpg
│  │  ├─ 631f5037aefc7.jpg
│  │  ├─ 63247ba95aebc.png
│  │  ├─ 632dcab05aa88.png
│  │  ├─ 6330d73cad882.jpg
│  │  ├─ 6357ff2ebc3e6.jpg
│  │  ├─ 635bc75f9ecd1.jpg
│  │  ├─ 638e680b4a10c.jpg
│  │  ├─ 63a31c747d071.jpg
│  │  ├─ 63a5c64032438.jpg
│  │  ├─ 63aae81999481.jpg
│  │  ├─ 63ac432c5405d.jpg
│  │  ├─ 63ac432c55c02.jpg
│  │  ├─ 63aeddb3d112d.jpg
│  │  ├─ 63aeddb3dc63f.jpg
│  │  ├─ 63aeddb3df692.jpg
│  │  ├─ 63aeddb3e7185.jpg
│  │  ├─ 63c7f8ab4c6af.png
│  │  ├─ 63e39f088a659.png
│  │  ├─ 63f8de3a262ef.jpg
│  │  ├─ 642615f66021c.png
│  │  ├─ 644f9ea5c4bd1.png
│  │  ├─ 645c30b1836c2.jpg
│  │  ├─ 6495bb11d348d.jpg
│  │  ├─ 64a58948ece06.jpeg
│  │  ├─ 64a85d467fb50.jpg
│  │  ├─ 64a85d4684dad.jpg
│  │  ├─ 64a85d84d697a.jpg
│  │  ├─ 64c846b6747b5.png
│  │  ├─ 64c846d517c67.png
│  │  ├─ 64fb9d0e22eb4.jpg
│  │  ├─ 650850a7338ae.png
│  │  ├─ 652fdfc52a23c.png
│  │  ├─ 653679841e9ce.jpg
│  │  ├─ 653950629f9fc.png
│  │  ├─ 65395062a4f82.png
│  │  ├─ 656f4628ebb11.png
│  │  ├─ 65956166b0229.png
│  │  ├─ 6596ad9c02065.png
│  │  ├─ 659d4ce4747df.png
│  │  ├─ 65b1207758bf6.jpg
│  │  ├─ 65e0c7a369254.jpeg
│  │  ├─ 66022251c75af.jpg
│  │  ├─ 66022251cd981.jpg
│  │  ├─ 660ffd1db7e48.png
│  │  ├─ 66229b47f0d9c.png
│  │  ├─ 663b79a023355.jpg
│  │  ├─ 664fd32e9b596.png
│  │  └─ urls.txt
│  ├─ urls.txt
│  └─ urlsimg-news.txt
└─ utils
   └─ utils.js

```