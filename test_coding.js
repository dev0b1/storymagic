const uploadfile = async(file, filepath) =>{
        const {error:err} = supabase.storage.from("files").upload(filepath, file)
        if (err){
            console.error(err)
            throw new Error(err.message)
        }
        return success
    }


const getPublicUrl = (file, filepath)=>{
    if(success){
        try{
        const {data: publicUrl} = supabase.storage.from("audios").getPublicUrl(filepath)
        const audiourl = publicUrl.publicUrl
        return audiourl
    }
        catch(error){
           console.error(error)
           throw new Error(error.message)
    }
    }
}