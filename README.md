# AptServer

AptServer es un script Google Sheet publicado como servicio Web. Permite exponer un archivo Sheet como "Base de datos" mediante una interfaz similar a un accesso REST.

Para funcionar el proyecto AptServer tiene que ser `publicado como un servicio Web`.

1. Copiar el archivo Google AptBase en una cuenta Google
    [AptBase](https://docs.google.com/spreadsheets/u/0/d/1TrTTjKL7AOBqthL2-ITdvqxAcu8U8P6yEnXvz4LBpR0/copy?usp=sharing) (Crear una copia)
    
2. Abrir el **editor de secuencias de comandos** en el menu Heramientas del archivo

3. Publicar como aplicación Web con accesso a cualquier persona incluso anónimos

El código prensente en este GitHub permite poner al día el script Google. Sólo copiar y pegar el contenido de cada archivo en su respectivo archivo en el proyecto Google Script y publicar una nueva version de la aplicación Web

La URL pedida por la aplicación APT se compone de 3 partes: la URL recibida en el punto 3 cuando se publica el script, `?spreadSheetId` y el ID google drive de la copia de AptBase realizada en el punto 1. ej. `1TrTTjKL7AOBqthL2-ITdvqxAcu8FKNP6yEnXvz4LBpR0`. La URL completa parece a eso `https://script.google.com/macros/s/AKfycbyp3Qb-mH2ysQCoofoT7omhJhYJ1tiEYYvc6WcDHw/exec?spreadsheetId=13u7K2hmcqKhPXSIaO2TkIkLqcilHRHq9jyFT_Ct78Qo` 
