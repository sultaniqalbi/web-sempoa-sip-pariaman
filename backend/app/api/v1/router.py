from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user, RoleChecker
from app.models.users import User, UserRole
from app.api.v1.endpoints import auth, siswa, guru, jadwal, absensi, pembayaran, bukti_transfer, quota, owner, galeri, portal

api_router = APIRouter()

# Mount routes
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(siswa.router, prefix="/siswa", tags=["siswa"])
api_router.include_router(guru.router, prefix="/guru", tags=["guru"])
api_router.include_router(jadwal.router, prefix="/jadwal", tags=["jadwal"])
api_router.include_router(absensi.router, prefix="/absensi", tags=["absensi"])
api_router.include_router(pembayaran.router, prefix="/pembayaran", tags=["pembayaran"])
api_router.include_router(bukti_transfer.router, prefix="/bukti-transfer", tags=["bukti-transfer"])
api_router.include_router(quota.router, prefix="/quota", tags=["quota"])
api_router.include_router(owner.router, prefix="/owner", tags=["owner"])
api_router.include_router(galeri.router, prefix="/galeri", tags=["galeri"])
api_router.include_router(portal.router, prefix="/portal", tags=["portal"])

@api_router.get("/test-protected")
async def test_protected(current_user: User = Depends(get_current_user)):
    return {
        "message": "Anda berhasil mengakses route terproteksi!",
        "user": {
            "email": current_user.email,
            "role": current_user.role,
            "nama": current_user.nama
        }
    }

@api_router.get("/test-owner-only")
async def test_owner_only(
    current_user: User = Depends(RoleChecker([UserRole.owner]))
):
    return {
        "message": "Halo Owner! Route ini terproteksi khusus role Owner.",
        "owner_name": current_user.nama
    }
