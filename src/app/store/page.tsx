function Category() {
  return (
    <div className="container ">
      <div className="flex  justify-between items-center" >
        <h2 className="text-3xl font-bold mb-4">หมวดหมู่</h2>

      </div>
      <div className="grid grid-cols-2 gap-4 ">
        <img src="https://img2.pic.in.th/pic/pimpaw-4daa1ee07fe0cc10.png" alt="image" className="rounded-lg w-full" />
        <img src="https://img2.pic.in.th/pic/pimpaw-4daa1ee07fe0cc10.png" alt="image" className="rounded-lg w-full" />
        <img src="https://img2.pic.in.th/pic/pimpaw-4daa1ee07fe0cc10.png" alt="image" className="rounded-lg w-full" />

      </div>

    </div>

  );
}

function Storepage() {
  return (
    <div className="container mx-auto px-4">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
<Category />

      </div>
        
      </div>
 
  )
}

export default Storepage